-- Migration: Unique Constraint für Invoices - Stornierte ausschließen
-- Datum: 2026-01-19
-- Beschreibung: Erlaubt neue Abrechnungen für Perioden mit stornierten Rechnungen

-- Alte Constraint löschen
ALTER TABLE invoices
DROP CONSTRAINT IF EXISTS unique_invoice_per_period;

-- Neuer Partial Unique Index (nur nicht-stornierte)
CREATE UNIQUE INDEX unique_invoice_per_period
ON invoices (user_id, invoice_type, kw_start, kw_end, year)
WHERE status != 'storniert';
