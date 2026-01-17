-- Migration: 034-invoice-status.sql
-- Aktualisiert Invoice-Status-Constraint
-- Status-Flow: entwurf → offen → geplant/bezahlt/storniert

-- Alten Constraint entfernen
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Neuen Constraint hinzufügen
ALTER TABLE public.invoices
ADD CONSTRAINT invoices_status_check
CHECK (status IN ('entwurf', 'offen', 'geplant', 'bezahlt', 'storniert'));

-- Bestehende Daten migrieren: freigegeben/versendet → offen
UPDATE public.invoices
SET status = 'offen'
WHERE status IN ('freigegeben', 'versendet');
