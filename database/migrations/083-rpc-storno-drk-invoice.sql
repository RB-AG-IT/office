-- Migration 083: RPC für DRK-Rechnungs-Storno mit Ledger-Gegenbuchung
-- Storniert eine Rechnung und erstellt Gegenbuchungen im Ledger

CREATE OR REPLACE FUNCTION storno_drk_invoice(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_number TEXT;
BEGIN
    -- Invoice-Nummer für Beschreibung holen
    SELECT invoice_number INTO v_invoice_number
    FROM invoices
    WHERE id = p_invoice_id;

    -- 1. Invoice-Status auf 'storniert' setzen
    UPDATE invoices
    SET status = 'storniert'
    WHERE id = p_invoice_id;

    -- 2. Gegenbuchungen für alle Ledger-Einträge dieser Rechnung
    -- WICHTIG: invoice_id = NULL, damit Kosten wieder "offen" sind!
    INSERT INTO drk_cost_ledger (
        customer_id, campaign_id, campaign_area_id, invoice_id,
        kostenart, pro, zeitraum, typ, betrag, einheiten, einzelbetrag,
        kw, year, bezeichnung, beschreibung
    )
    SELECT
        customer_id, campaign_id, campaign_area_id,
        NULL,               -- invoice_id = NULL → wieder offen für nächste Abrechnung!
        kostenart, pro, zeitraum,
        'storno',           -- typ = storno
        -betrag,            -- Negativer Betrag (Gegenbuchung)
        einheiten, einzelbetrag,
        kw, year, bezeichnung,
        'Storno zu Rechnung ' || COALESCE(v_invoice_number, p_invoice_id::TEXT)
    FROM drk_cost_ledger
    WHERE invoice_id = p_invoice_id AND typ = 'buchung';

    -- 3. Entitlements zurücksetzen (falls vorhanden)
    UPDATE record_entitlements
    SET
        invoice_id = NULL,
        status = 'faellig',
        abgerechnet_am = NULL
    WHERE invoice_id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', p_invoice_id,
        'invoice_number', v_invoice_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION storno_drk_invoice IS 'Storniert DRK-Rechnung mit Ledger-Gegenbuchung (Kosten werden wieder offen)';
