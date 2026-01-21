-- Migration 073: Reset Entitlements bei Rechnungs-Storno
-- Wenn eine Rechnung storniert wird, müssen die Entitlements
-- auf 'faellig' zurückgesetzt werden, damit sie wieder abgerechnet werden können

CREATE OR REPLACE FUNCTION reset_entitlements_on_invoice_storno()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nur bei Status-Änderung zu 'storniert'
    IF NEW.status = 'storniert' AND OLD.status != 'storniert' THEN
        UPDATE record_entitlements
        SET
            status = CASE
                WHEN faellig_ab <= CURRENT_DATE THEN 'faellig'
                ELSE 'ausstehend'
            END,
            invoice_id = NULL,
            abgerechnet_am = NULL,
            ist_sondierung = NULL,
            basis_satz = NULL,
            updated_at = now()
        WHERE invoice_id = OLD.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reset_entitlements_on_invoice_storno ON invoices;
CREATE TRIGGER trigger_reset_entitlements_on_invoice_storno
    AFTER UPDATE ON invoices
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION reset_entitlements_on_invoice_storno();

COMMENT ON FUNCTION reset_entitlements_on_invoice_storno IS
'Setzt Entitlements auf faellig zurück wenn eine Rechnung storniert wird';
