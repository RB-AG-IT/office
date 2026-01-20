-- Migration 070: RPC für VJ3-5 (2.-4. Jahresabrechnung) Berechnung
-- Berechnet VJ3-5 mit Qualitätsbonus und Storno-Verrechnung

CREATE OR REPLACE FUNCTION calculate_vj_data(
    p_kunde_id UUID,
    p_kampagne_id UUID,
    p_gebiet_ids UUID[],
    p_vj INTEGER  -- 3, 4 oder 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_gebiet_id UUID;
    v_gebiete_result JSONB := '[]'::JSONB;
    v_gebiet_data JSONB;
    v_gebiet_name TEXT;
    v_bonus_pp INTEGER := 0;
    v_aktive_mg JSONB;
    v_aktive_mg_count INTEGER := 0;
    v_aktive_mg_je NUMERIC := 0;
    v_stornos_count INTEGER := 0;
    v_stornos_betrag NUMERIC := 0;
    v_provision_sondierung JSONB;
    v_provision_regular JSONB;
    v_sond_satz INTEGER;
    v_reg_satz INTEGER;
    v_satz_key TEXT;
    v_abrechnungstyp TEXT;
BEGIN
    -- Abrechnungstyp bestimmen
    v_abrechnungstyp := CASE p_vj
        WHEN 3 THEN '2JA'
        WHEN 4 THEN '3JA'
        WHEN 5 THEN '4JA'
        ELSE NULL
    END;

    IF v_abrechnungstyp IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ungültiges Vergütungsjahr: ' || p_vj
        );
    END IF;

    -- Satz-Key für JSON (j3, j4, j5)
    v_satz_key := 'j' || p_vj;

    -- Pro Einsatzgebiet berechnen
    FOREACH v_gebiet_id IN ARRAY p_gebiet_ids
    LOOP
        -- Gebiet-Daten laden
        SELECT
            COALESCE(name, 'Unbekannt'),
            provision_sondierung,
            provision_regular
        INTO v_gebiet_name, v_provision_sondierung, v_provision_regular
        FROM campaign_areas
        WHERE id = v_gebiet_id;

        -- VJ-Sätze extrahieren
        v_sond_satz := COALESCE((v_provision_sondierung->>v_satz_key)::INTEGER, 0);
        v_reg_satz := COALESCE((v_provision_regular->>v_satz_key)::INTEGER, 0);

        -- Qualitätsbonus aus vorheriger Berechnung holen
        SELECT COALESCE(bonus_pp, 0)
        INTO v_bonus_pp
        FROM qualitaetsbonus_berechnungen
        WHERE campaign_area_id = v_gebiet_id;

        IF v_bonus_pp IS NULL THEN
            v_bonus_pp := 0;
        END IF;

        -- Aktive MG für dieses VJ
        SELECT
            COALESCE(jsonb_agg(jsonb_build_object(
                'record_id', re.record_id,
                'entitlement_id', re.id,
                'jahreseuros', re.jahreseuros,
                'ist_sondierung', re.ist_sondierung,
                'basis_satz', CASE
                    WHEN re.ist_sondierung = true THEN v_sond_satz
                    ELSE v_reg_satz
                END,
                'mit_bonus', CASE
                    WHEN re.ist_sondierung = true THEN v_sond_satz + v_bonus_pp
                    ELSE v_reg_satz + v_bonus_pp
                END
            )), '[]'::JSONB),
            COALESCE(COUNT(*), 0),
            COALESCE(SUM(re.jahreseuros), 0)
        INTO v_aktive_mg, v_aktive_mg_count, v_aktive_mg_je
        FROM record_entitlements re
        JOIN records r ON r.id = re.record_id
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = p_vj
          AND re.status = 'faellig'
          AND re.invoice_id IS NULL
          AND r.status = 'aktiv';

        -- Stornos verrechnen (vorheriges VJ abgerechnet, jetzt storniert)
        -- Bei VJ3 = Stornos aus VJ2, bei VJ4 = Stornos aus VJ3, etc.
        SELECT
            COALESCE(COUNT(DISTINCT re.record_id), 0),
            COALESCE(SUM(re.abgerechneter_betrag), 0)
        INTO v_stornos_count, v_stornos_betrag
        FROM record_entitlements re
        JOIN records r ON r.id = re.record_id
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = p_vj - 1  -- Vorheriges VJ
          AND re.status = 'storniert'
          AND re.invoice_id IS NOT NULL  -- War abgerechnet
          AND re.ist_abgesichert = false  -- Nicht abgesichert
          AND r.status = 'storno';

        -- Gebiet-Daten zusammenstellen
        v_gebiet_data := jsonb_build_object(
            'gebietId', v_gebiet_id,
            'gebietName', v_gebiet_name,
            'qualitaetsbonus', jsonb_build_object(
                'bonusPP', v_bonus_pp
            ),
            'vjMg', jsonb_build_object(
                'daten', v_aktive_mg,
                'anzahl', v_aktive_mg_count,
                'jahreseuros', v_aktive_mg_je,
                'sondSatz', v_sond_satz,
                'regSatz', v_reg_satz
            ),
            'stornos', jsonb_build_object(
                'anzahl', v_stornos_count,
                'betrag', v_stornos_betrag
            )
        );

        v_gebiete_result := v_gebiete_result || v_gebiet_data;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'typ', v_abrechnungstyp,
        'verguetungsjahr', p_vj,
        'gebiete', v_gebiete_result
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION calculate_vj_data IS 'Berechnet Daten für VJ3-5 Abrechnungen (mit Qualitätsbonus und Storno-Verrechnung)';
