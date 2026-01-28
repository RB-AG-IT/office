-- Migration 090: Storno auf einfaches System umstellen
-- Statt Gegenbuchungen: Einfach invoice_id = NULL setzen

CREATE OR REPLACE FUNCTION storno_drk_invoice(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_number TEXT;
BEGIN
    -- Invoice-Nummer holen
    SELECT invoice_number INTO v_invoice_number
    FROM invoices
    WHERE id = p_invoice_id;

    -- 1. Invoice-Status auf 'storniert' setzen
    UPDATE invoices
    SET status = 'storniert'
    WHERE id = p_invoice_id;

    -- 2. Ledger-Einträge freigeben (invoice_id = NULL)
    -- Alle Einträge (buchung + korrektur) dieser Rechnung werden wieder "offen"
    UPDATE drk_cost_ledger
    SET invoice_id = NULL
    WHERE invoice_id = p_invoice_id;

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

COMMENT ON FUNCTION storno_drk_invoice IS 'Storniert DRK-Rechnung - Ledger-Einträge werden freigegeben (invoice_id = NULL)';
