-- Migration: Entfernt stornorucklage_tracking Tabelle
-- Datum: 2026-01-17
-- Beschreibung: Tabelle wird nicht mehr benötigt - View stornorucklage_uebersicht
--               berechnet alles aus provisions_ledger (Single Source of Truth)

DROP TABLE IF EXISTS public.stornorucklage_tracking;
