-- ============================================================================
-- Migration 020: Altes Ledger-System entfernen
-- ============================================================================
-- Entfernt das alte EUR-basierte provisions_ledger System
-- Vorbereitung für neues EH-basiertes System
-- ============================================================================

-- 1. Trigger von Migration 018 entfernen
DROP TRIGGER IF EXISTS on_record_assignment_change ON public.records;

-- 2. Trigger-Funktion entfernen
DROP FUNCTION IF EXISTS handle_record_provision_update();

-- 3. Alte provisions_ledger Tabelle entfernen
-- ACHTUNG: Alle Daten gehen verloren!
DROP TABLE IF EXISTS public.provisions_ledger;

-- ============================================================================
-- HINWEIS: Nach dieser Migration ist das alte System vollständig entfernt.
-- Führe Migration 021 aus, um das neue System zu erstellen.
-- ============================================================================
