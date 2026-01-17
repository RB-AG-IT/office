-- Migration: Unique Constraint für Invoices
-- Datum: 2026-01-17
-- Beschreibung: Verhindert doppelte Abrechnungen auf DB-Ebene

ALTER TABLE invoices
ADD CONSTRAINT unique_invoice_per_period
UNIQUE (user_id, invoice_type, kw_start, kw_end, year);
