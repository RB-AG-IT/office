-- Migration 051: Fix RPC function - remove stornorucklage_tracking reference
-- Die Tabelle stornorucklage_tracking wurde in Migration 041 gelöscht

CREATE OR REPLACE FUNCTION create_invoice_transaction(input_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_invoice_id UUID;
    v_user_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_year INTEGER;
    v_vorschuss_anteil NUMERIC;
    v_invoice_type TEXT;
    v_provisionen JSONB;
    v_is_vat_liable BOOLEAN;
    v_vat_rate NUMERIC;
    v_vat_amount NUMERIC;
    v_total_payout NUMERIC;
    v_position RECORD;
    v_item RECORD;
    result JSONB;
BEGIN
    v_user_id := (input_data->>'userId')::UUID;
    v_period_start := (input_data->'zeitraum'->>'von')::DATE;
    v_period_end := (input_data->'zeitraum'->>'bis')::DATE;
    v_year := (input_data->>'year')::INTEGER;
    v_vorschuss_anteil := (input_data->>'vorschussAnteil')::NUMERIC;
    v_invoice_type := COALESCE(input_data->>'invoice_type', 'vorschuss');
    v_provisionen := COALESCE(input_data->'provisionen', '{"werben":0,"teamleitung":0,"quality":0,"empfehlung":0,"recruiting":0}'::JSONB);
    v_is_vat_liable := COALESCE((input_data->>'is_vat_liable')::BOOLEAN, false);
    v_vat_rate := COALESCE((input_data->>'vat_rate')::NUMERIC, 0);
    v_vat_amount := COALESCE((input_data->>'vat_amount')::NUMERIC, 0);
    v_total_payout := COALESCE((input_data->>'total_payout')::NUMERIC, (input_data->>'netto')::NUMERIC);

    INSERT INTO invoices (
        user_id, invoice_number, invoice_type, period_start, period_end,
        kw_start, kw_end, year, brutto_provision, vorschuss_betrag,
        stornorucklage_betrag, abzuege_unterkunft, abzuege_sonderposten,
        netto_auszahlung, gesamt_provision, gesamt_vorschuss, gesamt_stornorucklage,
        is_vat_liable, vat_rate, vat_amount, total_payout,
        calculation_data, status, scheduled_send_at
    ) VALUES (
        v_user_id, NULL, v_invoice_type, v_period_start, v_period_end,
        (input_data->>'kw_start')::INTEGER, (input_data->>'kw_end')::INTEGER,
        v_year, (input_data->>'brutto')::NUMERIC, (input_data->>'vorschuss')::NUMERIC,
        (input_data->>'stornorucklage')::NUMERIC,
        COALESCE((input_data->>'abzuegeUnterkunft')::NUMERIC, 0),
        COALESCE((input_data->>'abzuegeSonderposten')::NUMERIC, 0),
        (input_data->>'netto')::NUMERIC, (input_data->>'gesamtProvision')::NUMERIC,
        (input_data->>'gesamtVorschuss')::NUMERIC, (input_data->>'gesamtStornorucklage')::NUMERIC,
        v_is_vat_liable, v_vat_rate, v_vat_amount, v_total_payout,
        input_data->'calculation_data', 'entwurf', (input_data->>'scheduled_send_at')::TIMESTAMPTZ
    ) RETURNING id INTO new_invoice_id;

    IF v_provisionen->>'werben' IS NOT NULL AND (v_provisionen->>'werben')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (new_invoice_id, 'werben', (v_provisionen->>'werben')::NUMERIC, v_vorschuss_anteil,
            (v_provisionen->>'werben')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'werben')::NUMERIC * (100 - v_vorschuss_anteil) / 100);
    END IF;

    IF v_provisionen->>'teamleitung' IS NOT NULL AND (v_provisionen->>'teamleitung')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (new_invoice_id, 'teamleitung', (v_provisionen->>'teamleitung')::NUMERIC, v_vorschuss_anteil,
            (v_provisionen->>'teamleitung')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'teamleitung')::NUMERIC * (100 - v_vorschuss_anteil) / 100);
    END IF;

    IF v_provisionen->>'quality' IS NOT NULL AND (v_provisionen->>'quality')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (new_invoice_id, 'quality', (v_provisionen->>'quality')::NUMERIC, v_vorschuss_anteil,
            (v_provisionen->>'quality')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'quality')::NUMERIC * (100 - v_vorschuss_anteil) / 100);
    END IF;

    IF v_provisionen->>'empfehlung' IS NOT NULL AND (v_provisionen->>'empfehlung')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (new_invoice_id, 'empfehlung', (v_provisionen->>'empfehlung')::NUMERIC, v_vorschuss_anteil,
            (v_provisionen->>'empfehlung')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'empfehlung')::NUMERIC * (100 - v_vorschuss_anteil) / 100);
    END IF;

    IF v_provisionen->>'recruiting' IS NOT NULL AND (v_provisionen->>'recruiting')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (new_invoice_id, 'recruiting', (v_provisionen->>'recruiting')::NUMERIC, v_vorschuss_anteil,
            (v_provisionen->>'recruiting')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'recruiting')::NUMERIC * (100 - v_vorschuss_anteil) / 100);
    END IF;

    UPDATE provisions_ledger SET invoice_id = new_invoice_id
    WHERE user_id = v_user_id AND invoice_id IS NULL
      AND referenz_datum >= v_period_start AND referenz_datum <= v_period_end;

    UPDATE euro_ledger SET invoice_id = new_invoice_id
    WHERE user_id = v_user_id AND invoice_id IS NULL
      AND referenz_datum >= v_period_start AND referenz_datum <= v_period_end;

    IF COALESCE((input_data->>'stornorucklage')::NUMERIC, 0) > 0 THEN
        INSERT INTO invoice_items (invoice_id, position_type, description, quantity, unit_price, amount)
        VALUES (new_invoice_id, 'stornorucklage_einbehalt',
            'Stornorücklage (' || (100 - v_vorschuss_anteil)::TEXT || '%)',
            1, (input_data->>'stornorucklage')::NUMERIC, -(input_data->>'stornorucklage')::NUMERIC);
    END IF;

    IF COALESCE((input_data->>'abzuegeUnterkunft')::NUMERIC, 0) > 0 THEN
        INSERT INTO invoice_items (invoice_id, position_type, description, quantity, unit_price, amount)
        VALUES (new_invoice_id, 'unterkunft', 'Unterkunftskosten',
            1, (input_data->>'abzuegeUnterkunft')::NUMERIC, -(input_data->>'abzuegeUnterkunft')::NUMERIC);
    END IF;

    IF COALESCE((input_data->>'abzuegeSonderposten')::NUMERIC, 0) > 0 THEN
        INSERT INTO invoice_items (invoice_id, position_type, description, quantity, unit_price, amount)
        VALUES (new_invoice_id, 'sonderposten', 'Sonderposten',
            1, (input_data->>'abzuegeSonderposten')::NUMERIC, -(input_data->>'abzuegeSonderposten')::NUMERIC);
    END IF;

    SELECT row_to_json(i.*) INTO result FROM invoices i WHERE i.id = new_invoice_id;
    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
