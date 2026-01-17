-- Migration: Soft-Delete für Records mit Ledger-Gegenbuchung
-- Datum: 2026-01-17

-- 1. Neues Feld für Soft-Delete
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Index für Performance
CREATE INDEX IF NOT EXISTS idx_records_deleted_at ON records(deleted_at);

-- 3. Constraint für provisions_ledger erweitern (loeschung hinzufügen)
ALTER TABLE public.provisions_ledger
DROP CONSTRAINT IF EXISTS provisions_ledger_typ_check;

ALTER TABLE public.provisions_ledger
ADD CONSTRAINT provisions_ledger_typ_check
CHECK (typ IN ('provision', 'korrektur', 'loeschung'));
