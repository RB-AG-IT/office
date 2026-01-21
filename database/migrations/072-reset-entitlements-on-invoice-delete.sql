-- Migration 072: Reset Entitlements bei Entwurf-Löschung
-- Wenn ein Rechnungs-Entwurf gelöscht wird, müssen die Entitlements
-- auf ihren Ursprungszustand zurückgesetzt werden

CREATE OR REPLACE FUNCTION reset_entitlements_on_invoice_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nur bei Entwürfen zurücksetzen
    IF OLD.status = 'entwurf' THEN
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

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reset_entitlements_on_invoice_delete ON invoices;
CREATE TRIGGER trigger_reset_entitlements_on_invoice_delete
    BEFORE DELETE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION reset_entitlements_on_invoice_delete();

COMMENT ON FUNCTION reset_entitlements_on_invoice_delete IS
'Setzt Entitlements auf Ursprungszustand zurück wenn ein Rechnungs-Entwurf gelöscht wird';
