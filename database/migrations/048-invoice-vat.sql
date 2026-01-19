-- Migration: 048-invoice-vat.sql
-- Fügt USt-Felder zur invoices Tabelle hinzu

-- Neue Spalten für Umsatzsteuer
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_vat_liable BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_payout DECIMAL(12,2);

-- total_payout = netto_auszahlung + vat_amount
-- Bestehende Abrechnungen: total_payout = netto_auszahlung (keine USt)
UPDATE invoices SET total_payout = netto_auszahlung WHERE total_payout IS NULL;
