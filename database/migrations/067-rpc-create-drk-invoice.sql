-- Migration 067: RPC für DRK-Kundenrechnung erstellen
-- Erstellt eine oder mehrere Rechnungen basierend auf abrechnungData aus dem Frontend

CREATE OR REPLACE FUNCTION create_drk_invoice(input_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_kunde_id UUID;
    v_kampagne_id UUID;
    v_status TEXT;
    v_rechnungsart TEXT;
    v_typ TEXT;
    v_zeitraum_von DATE;
    v_zeitraum_bis DATE;
    v_vertrag TEXT;
    v_empfaenger_typ TEXT;
    v_kunden_nr TEXT;
    v_rechnung JSONB;
    v_new_invoice_id UUID;
    v_created_invoices JSONB := '[]'::JSONB;
    v_entitlement_ids UUID[];
    v_record JSONB;
BEGIN
    -- Gemeinsame Parameter extrahieren
    v_kunde_id := (input_data->>'kundeId')::UUID;
    v_kampagne_id := (input_data->>'kampagneId')::UUID;
    v_status := COALESCE(input_data->>'status', 'entwurf');
    v_rechnungsart := COALESCE(input_data->>'rechnungsart', 'zusammen');
    v_typ := input_data->>'typ';
    v_zeitraum_von := (input_data->>'zeitraumVon')::DATE;
    v_zeitraum_bis := (input_data->>'zeitraumBis')::DATE;
    v_vertrag := input_data->>'vertrag';

    -- Empfängertyp und Kundennummer aus customers laden
    SELECT
        COALESCE(empfaenger_typ, 'OV'),
        COALESCE(kunden_nr_ziffern, '000')
    INTO v_empfaenger_typ, v_kunden_nr
    FROM customers
    WHERE id = v_kunde_id;

    -- Fall 1: Zusammen - Eine Rechnung für alle Einsatzgebiete
    IF v_rechnungsart = 'zusammen' THEN
        -- Sondierungsrechnung erstellen (wenn Positionen vorhanden)
        IF jsonb_array_length(COALESCE(input_data->'sondierungPositionen', '[]'::JSONB)) > 0 THEN
            INSERT INTO invoices (
                customer_id,
                campaign_id,
                status,
                abrechnungstyp,
                empfaenger_typ,
                kunden_nr,
                vertragsnummer,
                ist_sondierung,
                period_start,
                period_end,
                netto_auszahlung,
                vat_rate,
                vat_amount,
                total_payout,
                calculation_data
            ) VALUES (
                v_kunde_id,
                v_kampagne_id,
                v_status,
                v_typ,
                v_empfaenger_typ,
                v_kunden_nr,
                v_vertrag,
                true,  -- ist_sondierung
                v_zeitraum_von,
                v_zeitraum_bis,
                (input_data->>'netto')::NUMERIC,
                19,
                (input_data->>'ust')::NUMERIC,
                (input_data->>'brutto')::NUMERIC,
                jsonb_build_object(
                    'positionen', input_data->'sondierungPositionen',
                    'zubuchungen', COALESCE(input_data->'zubuchungen', '[]'::JSONB),
                    'stornopuffer', input_data->'stornopuffer',
                    'stornopufferProzent', input_data->'stornopufferProzent',
                    'zwischensumme', input_data->'zwischensumme'
                )
            ) RETURNING id INTO v_new_invoice_id;

            v_created_invoices := v_created_invoices || jsonb_build_object(
                'id', v_new_invoice_id,
                'typ', 'sondierung'
            );

            -- Entitlements für Sondierung aktualisieren
            FOR v_record IN SELECT * FROM jsonb_array_elements(input_data->'sondierungPositionen')
            LOOP
                UPDATE record_entitlements
                SET
                    invoice_id = v_new_invoice_id,
                    status = 'abgerechnet',
                    abgerechnet_am = NOW()::DATE,
                    ist_sondierung = true,
                    basis_satz = (v_record->>'satz')::INTEGER
                WHERE customer_id = v_kunde_id
                  AND campaign_area_id = (v_record->>'gebietId')::UUID
                  AND verguetungsjahr = CASE
                      WHEN v_typ IN ('ZA', 'EA') THEN 1
                      WHEN v_typ = '1JA' THEN 2
                      WHEN v_typ = '2JA' THEN 3
                      WHEN v_typ = '3JA' THEN 4
                      WHEN v_typ = '4JA' THEN 5
                  END
                  AND status IN ('faellig', 'ausstehend')
                  AND invoice_id IS NULL;
            END LOOP;
        END IF;

        -- Regularrechnung erstellen (wenn Positionen vorhanden)
        IF jsonb_array_length(COALESCE(input_data->'regularPositionen', '[]'::JSONB)) > 0 THEN
            INSERT INTO invoices (
                customer_id,
                campaign_id,
                status,
                abrechnungstyp,
                empfaenger_typ,
                kunden_nr,
                vertragsnummer,
                ist_sondierung,
                period_start,
                period_end,
                netto_auszahlung,
                vat_rate,
                vat_amount,
                total_payout,
                calculation_data
            ) VALUES (
                v_kunde_id,
                v_kampagne_id,
                v_status,
                v_typ,
                v_empfaenger_typ,
                v_kunden_nr,
                v_vertrag,
                false,  -- ist_sondierung = false (Regular)
                v_zeitraum_von,
                v_zeitraum_bis,
                (input_data->>'netto')::NUMERIC,
                19,
                (input_data->>'ust')::NUMERIC,
                (input_data->>'brutto')::NUMERIC,
                jsonb_build_object(
                    'positionen', input_data->'regularPositionen',
                    'zubuchungen', COALESCE(input_data->'zubuchungen', '[]'::JSONB),
                    'stornopuffer', input_data->'stornopuffer',
                    'stornopufferProzent', input_data->'stornopufferProzent',
                    'zwischensumme', input_data->'zwischensumme'
                )
            ) RETURNING id INTO v_new_invoice_id;

            v_created_invoices := v_created_invoices || jsonb_build_object(
                'id', v_new_invoice_id,
                'typ', 'regular'
            );

            -- Entitlements für Regular aktualisieren
            FOR v_record IN SELECT * FROM jsonb_array_elements(input_data->'regularPositionen')
            LOOP
                UPDATE record_entitlements
                SET
                    invoice_id = v_new_invoice_id,
                    status = 'abgerechnet',
                    abgerechnet_am = NOW()::DATE,
                    ist_sondierung = false,
                    basis_satz = (v_record->>'satz')::INTEGER
                WHERE customer_id = v_kunde_id
                  AND campaign_area_id = (v_record->>'gebietId')::UUID
                  AND verguetungsjahr = CASE
                      WHEN v_typ IN ('ZA', 'EA') THEN 1
                      WHEN v_typ = '1JA' THEN 2
                      WHEN v_typ = '2JA' THEN 3
                      WHEN v_typ = '3JA' THEN 4
                      WHEN v_typ = '4JA' THEN 5
                  END
                  AND status IN ('faellig', 'ausstehend')
                  AND invoice_id IS NULL;
            END LOOP;
        END IF;

    -- Fall 2: Getrennt - Eine Rechnung pro Einsatzgebiet (enthält Sondierung + Regular)
    ELSE
        FOR v_rechnung IN SELECT * FROM jsonb_array_elements(input_data->'rechnungen')
        LOOP
            INSERT INTO invoices (
                customer_id,
                campaign_id,
                campaign_area_id,
                status,
                abrechnungstyp,
                empfaenger_typ,
                kunden_nr,
                vertragsnummer,
                ist_sondierung,
                period_start,
                period_end,
                netto_auszahlung,
                vat_rate,
                vat_amount,
                total_payout,
                calculation_data
            ) VALUES (
                v_kunde_id,
                v_kampagne_id,
                (v_rechnung->'gebiet'->>'id')::UUID,
                v_status,
                v_typ,
                v_empfaenger_typ,
                v_kunden_nr,
                v_vertrag,
                NULL,  -- Bei getrennt: NULL (enthält beides)
                v_zeitraum_von,
                v_zeitraum_bis,
                (v_rechnung->>'netto')::NUMERIC,
                19,
                (v_rechnung->>'ust')::NUMERIC,
                (v_rechnung->>'brutto')::NUMERIC,
                jsonb_build_object(
                    'gebiet', v_rechnung->'gebiet'->>'name',
                    'mgSond', v_rechnung->'mgSond',
                    'mgReg', v_rechnung->'mgReg',
                    'mgTotal', v_rechnung->'mgTotal',
                    'sondBetrag', v_rechnung->'sondBetrag',
                    'regBetrag', v_rechnung->'regBetrag',
                    'zubuchungen', COALESCE(v_rechnung->'zubuchungen', '[]'::JSONB),
                    'zubuchungenBetrag', v_rechnung->'zubuchungenBetrag',
                    'zwischensumme', v_rechnung->'zwischensumme',
                    'stornopuffer', v_rechnung->'stornopuffer'
                )
            ) RETURNING id INTO v_new_invoice_id;

            v_created_invoices := v_created_invoices || jsonb_build_object(
                'id', v_new_invoice_id,
                'gebiet', v_rechnung->'gebiet'->>'name'
            );

            -- Entitlements für dieses Gebiet aktualisieren
            UPDATE record_entitlements
            SET
                invoice_id = v_new_invoice_id,
                status = 'abgerechnet',
                abgerechnet_am = NOW()::DATE
            WHERE customer_id = v_kunde_id
              AND campaign_area_id = (v_rechnung->'gebiet'->>'id')::UUID
              AND verguetungsjahr = CASE
                  WHEN v_typ IN ('ZA', 'EA') THEN 1
                  WHEN v_typ = '1JA' THEN 2
                  WHEN v_typ = '2JA' THEN 3
                  WHEN v_typ = '3JA' THEN 4
                  WHEN v_typ = '4JA' THEN 5
              END
              AND status IN ('faellig', 'ausstehend')
              AND invoice_id IS NULL;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'invoices', v_created_invoices,
        'count', jsonb_array_length(v_created_invoices)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION create_drk_invoice IS 'Erstellt DRK-Kundenrechnungen (Zusammen oder Getrennt)';
