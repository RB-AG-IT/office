-- Migration: Quelle-Feld für euro_ledger (Vorschuss/Stornorücklage)
-- Datum: 2026-01-17

-- 1. Spalte hinzufügen
ALTER TABLE public.euro_ledger
ADD COLUMN IF NOT EXISTS quelle TEXT CHECK (quelle IN ('vorschuss', 'stornorucklage'));

-- 2. Default für bestehende Einträge setzen (alle bisherigen waren Vorschuss-Abzüge)
UPDATE public.euro_ledger
SET quelle = 'vorschuss'
WHERE quelle IS NULL;

-- 3. Index für bessere Abfrage-Performance
CREATE INDEX IF NOT EXISTS idx_euro_ledger_quelle ON euro_ledger(quelle);
