-- ============================================================================
-- Migration 017: Remove werben_faktor from user_provision_settings
-- ============================================================================
-- Erstellt: 10.01.2026
-- Grund: Der Werben-Faktor wird pro Zeitraum aus user_roles (role_type='career')
--        gelesen und nicht zentral in user_provision_settings gespeichert.
-- ============================================================================

-- 1. Trigger entfernen (falls vorhanden)
DROP TRIGGER IF EXISTS trigger_sync_roles_to_provision ON public.user_roles;
DROP TRIGGER IF EXISTS trigger_sync_provision_to_roles ON public.user_provision_settings;

-- 2. Funktionen entfernen (falls vorhanden)
DROP FUNCTION IF EXISTS sync_roles_to_provision_settings();
DROP FUNCTION IF EXISTS sync_provision_settings_to_roles();

-- 3. Spalte entfernen
ALTER TABLE public.user_provision_settings
DROP COLUMN IF EXISTS werben_faktor;

-- ============================================================================
-- Prüfung nach Ausführung:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'user_provision_settings';
-- ============================================================================
