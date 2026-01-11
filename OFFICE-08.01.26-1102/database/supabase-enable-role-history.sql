-- ================================================================
-- ROLLEN-HISTORIE AKTIVIEREN
-- ================================================================
-- Ermöglicht das Speichern der Historie von Rollen-Änderungen
-- ohne Fehler beim erneuten Zuweisen derselben Rolle
-- ================================================================

-- Schritt 1: Alte Regel löschen (die verhindert, dass dieselbe Rolle 2x existiert)
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_type_role_name_key;

-- Schritt 2: Neue Regel erstellen (erlaubt dieselbe Rolle mehrfach, aber nur 1x als "aktiv")
-- Das bedeutet: Sie können die Historie sehen (alte = inaktiv), aber nur 1 aktuelle Rolle haben
CREATE UNIQUE INDEX user_roles_active_unique
ON public.user_roles (user_id, role_type, role_name)
WHERE is_active = true;

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '✅ Rollen-Historie wurde aktiviert!';
    RAISE NOTICE '';
    RAISE NOTICE 'Ab jetzt:';
    RAISE NOTICE '  - Alte Rollen bleiben gespeichert (als inaktiv)';
    RAISE NOTICE '  - Sie können Rollen entfernen und später wieder hinzufügen';
    RAISE NOTICE '  - Kein Fehler mehr beim Speichern!';
    RAISE NOTICE '  - Sie können in der Datenbank sehen, wer wann welche Rolle hatte';
END $$;
