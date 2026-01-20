-- Migration 069: RPC für VJ2 (1. Jahresabrechnung) Berechnung
-- Berechnet Qualitätsbonus, rückwirkende VJ1-Korrektur und VJ2-Abrechnung

CREATE OR REPLACE FUNCTION calculate_vj2_data(
    p_kunde_id UUID,
    p_kampagne_id UUID,
    p_gebiet_ids UUID[]
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
    v_gesamt_mg INTEGER;
    v_stornierte_mg INTEGER;
    v_stornoquote NUMERIC;
    v_bonus_pp INTEGER := 0;
    v_qualitaetsbonus_regeln JSONB;
    v_regel RECORD;
    v_aktive_mg JSONB;
    v_aktive_mg_count INTEGER := 0;
    v_aktive_mg_je NUMERIC := 0;
    v_vj1_korrektur JSONB;
    v_vj1_korrektur_summe NUMERIC := 0;
    v_stornos_count INTEGER := 0;
    v_stornos_betrag NUMERIC := 0;
    v_provision_sondierung JSONB;
    v_provision_regular JSONB;
    v_sond_satz_vj2 INTEGER;
    v_reg_satz_vj2 INTEGER;
BEGIN
    -- Pro Einsatzgebiet berechnen
    FOREACH v_gebiet_id IN ARRAY p_gebiet_ids
    LOOP
        -- Gebiet-Daten laden
        SELECT
            COALESCE(name, 'Unbekannt'),
            provision_sondierung,
            provision_regular,
            COALESCE(qualitaetsbonus, '{}'::JSONB)
        INTO v_gebiet_name, v_provision_sondierung, v_provision_regular, v_qualitaetsbonus_regeln
        FROM campaign_areas
        WHERE id = v_gebiet_id;

        -- VJ2-Sätze extrahieren
        v_sond_satz_vj2 := COALESCE((v_provision_sondierung->>'j2')::INTEGER, 50);
        v_reg_satz_vj2 := COALESCE((v_provision_regular->>'j2')::INTEGER, 40);

        -- 1. Qualitätsbonus berechnen (Stornoquote)
        -- Gesamt MG in diesem Gebiet (die für VJ1 abgerechnet wurden)
        SELECT COUNT(DISTINCT re.record_id)
        INTO v_gesamt_mg
        FROM record_entitlements re
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = 1
          AND re.status IN ('abgerechnet', 'storniert', 'teilverguetet');

        -- Stornierte MG
        SELECT COUNT(DISTINCT re.record_id)
        INTO v_stornierte_mg
        FROM record_entitlements re
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = 1
          AND re.status IN ('storniert', 'teilverguetet');

        -- Stornoquote berechnen
        IF v_gesamt_mg > 0 THEN
            v_stornoquote := (v_stornierte_mg::NUMERIC / v_gesamt_mg::NUMERIC) * 100;
        ELSE
            v_stornoquote := 0;
        END IF;

        -- Bonus-PP ermitteln basierend auf Regeln
        v_bonus_pp := 0;
        IF v_qualitaetsbonus_regeln->>'aktiv' = 'true' AND
           v_qualitaetsbonus_regeln->'regeln' IS NOT NULL THEN
            -- Regeln durchgehen (von niedrigster zu höchster Stornoquote)
            FOR v_regel IN
                SELECT
                    (jsonb_array_elements(v_qualitaetsbonus_regeln->'regeln')->>'storno')::NUMERIC AS storno_grenze,
                    (jsonb_array_elements(v_qualitaetsbonus_regeln->'regeln')->>'pp')::INTEGER AS bonus_pp
                ORDER BY storno_grenze ASC
            LOOP
                IF v_stornoquote <= v_regel.storno_grenze THEN
                    v_bonus_pp := v_regel.bonus_pp;
                    EXIT;  -- Ersten passenden Bonus nehmen
                END IF;
            END LOOP;
        END IF;

        -- 2. Rückwirkende VJ1-Korrektur berechnen
        -- Für alle aktiven MG, die VJ1 abgerechnet haben, Differenz durch Bonus berechnen
        SELECT
            COALESCE(jsonb_agg(jsonb_build_object(
                'record_id', re.record_id,
                'jahreseuros', re.jahreseuros,
                'basis_satz_vj1', re.basis_satz,
                'neuer_satz_vj1', re.basis_satz + v_bonus_pp,
                'differenz', (re.jahreseuros * v_bonus_pp / 100)
            )), '[]'::JSONB),
            COALESCE(SUM(re.jahreseuros * v_bonus_pp / 100), 0)
        INTO v_vj1_korrektur, v_vj1_korrektur_summe
        FROM record_entitlements re
        JOIN records r ON r.id = re.record_id
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = 1
          AND re.status = 'abgerechnet'
          AND r.status = 'aktiv';

        -- 3. Aktive MG für VJ2 (status = faellig, verguetungsjahr = 2)
        SELECT
            COALESCE(jsonb_agg(jsonb_build_object(
                'record_id', re.record_id,
                'entitlement_id', re.id,
                'jahreseuros', re.jahreseuros,
                'ist_sondierung', re.ist_sondierung,
                'basis_satz', CASE
                    WHEN re.ist_sondierung = true THEN v_sond_satz_vj2
                    ELSE v_reg_satz_vj2
                END,
                'mit_bonus', CASE
                    WHEN re.ist_sondierung = true THEN v_sond_satz_vj2 + v_bonus_pp
                    ELSE v_reg_satz_vj2 + v_bonus_pp
                END
            )), '[]'::JSONB),
            COALESCE(COUNT(*), 0),
            COALESCE(SUM(re.jahreseuros), 0)
        INTO v_aktive_mg, v_aktive_mg_count, v_aktive_mg_je
        FROM record_entitlements re
        JOIN records r ON r.id = re.record_id
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = 2
          AND re.status = 'faellig'
          AND re.invoice_id IS NULL
          AND r.status = 'aktiv';

        -- 4. Stornos seit EA verrechnen (VJ1 abgerechnet, jetzt storniert)
        -- Diese müssen mit dem VJ1-Betrag verrechnet werden
        SELECT
            COALESCE(COUNT(DISTINCT re.record_id), 0),
            COALESCE(SUM(re.abgerechneter_betrag), 0)
        INTO v_stornos_count, v_stornos_betrag
        FROM record_entitlements re
        JOIN records r ON r.id = re.record_id
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = 1
          AND re.status = 'storniert'
          AND re.invoice_id IS NOT NULL
          AND re.ist_abgesichert = false  -- Nur nicht abgesicherte
          AND r.status = 'storno';

        -- Gebiet-Daten zusammenstellen
        v_gebiet_data := jsonb_build_object(
            'gebietId', v_gebiet_id,
            'gebietName', v_gebiet_name,
            'qualitaetsbonus', jsonb_build_object(
                'gesamtMg', v_gesamt_mg,
                'stornierteMg', v_stornierte_mg,
                'stornoquote', ROUND(v_stornoquote, 2),
                'bonusPP', v_bonus_pp
            ),
            'vj1Korrektur', jsonb_build_object(
                'records', v_vj1_korrektur,
                'summe', v_vj1_korrektur_summe
            ),
            'vj2Mg', jsonb_build_object(
                'daten', v_aktive_mg,
                'anzahl', v_aktive_mg_count,
                'jahreseuros', v_aktive_mg_je,
                'sondSatz', v_sond_satz_vj2,
                'regSatz', v_reg_satz_vj2
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
        'typ', '1JA',
        'gebiete', v_gebiete_result
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Funktion zum Speichern des Qualitätsbonus
CREATE OR REPLACE FUNCTION save_qualitaetsbonus(
    p_kampagne_id UUID,
    p_gebiet_id UUID,
    p_gesamt_mg INTEGER,
    p_stornierte_mg INTEGER,
    p_stornoquote NUMERIC,
    p_bonus_pp INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Erst prüfen ob bereits existiert (Update) oder neu (Insert)
    INSERT INTO qualitaetsbonus_berechnungen (
        campaign_id,
        campaign_area_id,
        berechnet_am,
        gesamt_mg,
        stornierte_mg,
        stornoquote,
        bonus_pp
    ) VALUES (
        p_kampagne_id,
        p_gebiet_id,
        CURRENT_DATE,
        p_gesamt_mg,
        p_stornierte_mg,
        p_stornoquote,
        p_bonus_pp
    )
    ON CONFLICT (campaign_area_id) DO UPDATE SET
        berechnet_am = CURRENT_DATE,
        gesamt_mg = p_gesamt_mg,
        stornierte_mg = p_stornierte_mg,
        stornoquote = p_stornoquote,
        bonus_pp = p_bonus_pp
    RETURNING id INTO v_id;

    -- Bonus auch in record_entitlements aktualisieren (VJ2-5)
    UPDATE record_entitlements
    SET qualitaetsbonus_pp = p_bonus_pp
    WHERE campaign_area_id = p_gebiet_id
      AND verguetungsjahr >= 2
      AND status IN ('ausstehend', 'faellig');

    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION calculate_vj2_data IS 'Berechnet alle Daten für VJ2-Abrechnung inkl. Qualitätsbonus und VJ1-Korrektur';
COMMENT ON FUNCTION save_qualitaetsbonus IS 'Speichert Qualitätsbonus-Berechnung und aktualisiert record_entitlements';
