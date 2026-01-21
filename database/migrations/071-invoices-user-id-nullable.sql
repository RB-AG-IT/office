-- Migration 071: Spalten nullable machen für DRK-Kundenrechnungen
-- DRK-Rechnungen haben andere Felder als Botschafter-Rechnungen

-- Botschafter-spezifische Felder nullable machen
ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN invoice_type DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN year DROP NOT NULL;

-- invoice_number: UNIQUE Constraint entfernen und neu anlegen (erlaubt NULL)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
ALTER TABLE invoices ALTER COLUMN invoice_number DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_invoice_number_unique ON invoices(invoice_number) WHERE invoice_number IS NOT NULL;

-- Kommentare
COMMENT ON COLUMN invoices.user_id IS
'User-ID für Botschafter-Rechnungen. NULL bei DRK-Kundenrechnungen (dort wird customer_id verwendet).';

COMMENT ON COLUMN invoices.invoice_type IS
'Rechnungstyp für Botschafter (vorschuss/endabrechnung). NULL bei DRK-Kundenrechnungen (dort wird abrechnungstyp verwendet).';

COMMENT ON COLUMN invoices.invoice_number IS
'Rechnungsnummer. Bei DRK-Rechnungen erst gesetzt wenn status=offen (via Trigger).';

COMMENT ON COLUMN invoices.year IS
'Jahr für Botschafter-Rechnungen. Bei DRK-Rechnungen wird period_start/period_end verwendet.';
