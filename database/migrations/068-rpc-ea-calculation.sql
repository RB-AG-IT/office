-- Migration 068: RPC für EA (Endabrechnung) Berechnung
-- Berechnet alle Daten für eine Endabrechnung: Stornopuffer-Auflösung, Stornos, restliche MG

CREATE OR REPLACE FUNCTION calculate_ea_data(
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
    v_stornopuffer_total NUMERIC := 0;
    v_stornos_betrag NUMERIC := 0;
    v_stornos_count INTEGER := 0;
    v_restliche_mg JSONB;
    v_restliche_mg_count INTEGER := 0;
    v_restliche_mg_je NUMERIC := 0;
    v_stornopuffer_prozent INTEGER;
    v_gebiet_name TEXT;
    v_bereits_abgerechnet JSONB := '[]'::JSONB;
    v_bereits_abgerechnet_summe NUMERIC := 0;
BEGIN
    -- Pro Einsatzgebiet berechnen
    FOREACH v_gebiet_id IN ARRAY p_gebiet_ids
    LOOP
        -- Gebietname und Stornopuffer-Prozent laden
        SELECT
            COALESCE(name, 'Unbekannt'),
            COALESCE((provision_sondierung->>'stornopuffer')::INTEGER, 10)
        INTO v_gebiet_name, v_stornopuffer_prozent
        FROM campaign_areas
        WHERE id = v_gebiet_id;

        -- 1. Stornopuffer aus bisherigen ZA-Rechnungen auflösen
        SELECT COALESCE(SUM(
            CASE
                WHEN calculation_data->>'stornopuffer' IS NOT NULL
                THEN (calculation_data->>'stornopuffer')::NUMERIC
                ELSE 0
            END
        ), 0)
        INTO v_stornopuffer_total
        FROM invoices
        WHERE customer_id = p_kunde_id
          AND campaign_id = p_kampagne_id
          AND (campaign_area_id = v_gebiet_id OR campaign_area_id IS NULL)
          AND abrechnungstyp = 'ZA'
          AND status != 'storniert';

        -- 2. Stornierte Records seit letzter ZA finden (die schon abgerechnet waren)
        -- Diese müssen verrechnet werden
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
          AND re.invoice_id IS NOT NULL  -- Bereits abgerechnet
          AND r.status = 'storno';

        -- 3. Bereits abgerechnete ZA-Rechnungen für Verrechnung
        SELECT
            COALESCE(jsonb_agg(jsonb_build_object(
                'id', i.id,
                'invoice_number', i.invoice_number,
                'periode', CONCAT(TO_CHAR(i.period_start, 'DD.MM.YY'), ' - ', TO_CHAR(i.period_end, 'DD.MM.YY')),
                'brutto', i.total_payout,
                'netto', i.netto_auszahlung
            )), '[]'::JSONB),
            COALESCE(SUM(i.netto_auszahlung), 0)
        INTO v_bereits_abgerechnet, v_bereits_abgerechnet_summe
        FROM invoices i
        WHERE i.customer_id = p_kunde_id
          AND i.campaign_id = p_kampagne_id
          AND (i.campaign_area_id = v_gebiet_id OR i.campaign_area_id IS NULL)
          AND i.abrechnungstyp = 'ZA'
          AND i.status IN ('offen', 'geplant', 'bezahlt');

        -- 4. Restliche MG für dieses Gebiet (noch nicht abgerechnet, VJ1, faellig)
        SELECT
            COALESCE(jsonb_agg(jsonb_build_object(
                'record_id', re.record_id,
                'entitlement_id', re.id,
                'jahreseuros', re.jahreseuros,
                'ist_sondierung', re.ist_sondierung,
                'basis_satz', re.basis_satz
            )), '[]'::JSONB),
            COALESCE(COUNT(*), 0),
            COALESCE(SUM(re.jahreseuros), 0)
        INTO v_restliche_mg, v_restliche_mg_count, v_restliche_mg_je
        FROM record_entitlements re
        JOIN records r ON r.id = re.record_id
        WHERE re.customer_id = p_kunde_id
          AND re.campaign_area_id = v_gebiet_id
          AND re.verguetungsjahr = 1
          AND re.status = 'faellig'
          AND re.invoice_id IS NULL
          AND r.status = 'aktiv';

        -- Gebiet-Daten zusammenstellen
        v_gebiet_data := jsonb_build_object(
            'gebietId', v_gebiet_id,
            'gebietName', v_gebiet_name,
            'stornopufferAufloesung', v_stornopuffer_total,
            'stornos', jsonb_build_object(
                'anzahl', v_stornos_count,
                'betrag', v_stornos_betrag
            ),
            'bereitsAbgerechnet', jsonb_build_object(
                'rechnungen', v_bereits_abgerechnet,
                'summe', v_bereits_abgerechnet_summe
            ),
            'restlicheMg', jsonb_build_object(
                'daten', v_restliche_mg,
                'anzahl', v_restliche_mg_count,
                'jahreseuros', v_restliche_mg_je
            ),
            'stornopufferProzent', v_stornopuffer_prozent
        );

        v_gebiete_result := v_gebiete_result || v_gebiet_data;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'typ', 'EA',
        'gebiete', v_gebiete_result
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION calculate_ea_data IS 'Berechnet alle Daten für eine DRK-Endabrechnung (Stornopuffer-Auflösung, Stornos, restliche MG)';
