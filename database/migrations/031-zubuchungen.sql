-- ============================================================================
-- Migration 031: Zubuchungen zum Abzüge-System hinzufügen
-- ============================================================================
--
-- Problem: Aktuell können nur Abzüge (negativ) verbucht werden
-- Lösung: buchung_art Feld hinzufügen für 'abzug' | 'zubuchung'
--
-- Erstellt: 11.01.2026
-- ============================================================================

-- 1. NEUES FELD: buchung_art
ALTER TABLE public.abzuege
ADD COLUMN IF NOT EXISTS buchung_art TEXT DEFAULT 'abzug'
CHECK (buchung_art IN ('abzug', 'zubuchung'));

-- 2. BESTEHENDE EINTRÄGE: Alle als 'abzug' markieren (falls NULL)
UPDATE public.abzuege
SET buchung_art = 'abzug'
WHERE buchung_art IS NULL;

-- 3. NOT NULL CONSTRAINT hinzufügen
ALTER TABLE public.abzuege
ALTER COLUMN buchung_art SET NOT NULL;

-- 4. COMMENT für Dokumentation
COMMENT ON COLUMN public.abzuege.buchung_art IS
'Art der Buchung: abzug (wird subtrahiert) oder zubuchung (wird addiert)';

-- 5. INDEX für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_abzuege_buchung_art ON public.abzuege(buchung_art);

-- ============================================================================
-- DONE
-- ============================================================================
