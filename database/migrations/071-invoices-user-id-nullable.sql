-- Migration 071: Spalten nullable machen für DRK-Kundenrechnungen
-- DRK-Rechnungen haben customer_id statt user_id und abrechnungstyp statt invoice_type

ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN invoice_type DROP NOT NULL;

COMMENT ON COLUMN invoices.user_id IS
'User-ID für Botschafter-Rechnungen. NULL bei DRK-Kundenrechnungen (dort wird customer_id verwendet).';

COMMENT ON COLUMN invoices.invoice_type IS
'Rechnungstyp für Botschafter (vorschuss/endabrechnung). NULL bei DRK-Kundenrechnungen (dort wird abrechnungstyp verwendet).';
