-- ================================================================
-- KARRIERESTUFEN: valid_from HINZUFÜGEN
-- ================================================================
-- Ermöglicht die Angabe eines Gültigkeits-Zeitraums (von-bis)
-- für Karrierestufen. Wenn "bis" abgelaufen ist und kein neuer
-- Eintrag existiert, gilt der letzte Faktor weiter.
-- ================================================================

-- Schritt 1: valid_from Spalte hinzufügen (falls nicht vorhanden)
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS valid_from DATE;

-- Schritt 2: Bestehende Einträge mit assigned_at als valid_from befüllen
UPDATE public.user_roles
SET valid_from = DATE(assigned_at)
WHERE valid_from IS NULL AND role_type = 'career';

-- Schritt 3: Index für performante Abfragen
CREATE INDEX IF NOT EXISTS idx_user_roles_valid_from
ON public.user_roles(valid_from)
WHERE role_type = 'career';

CREATE INDEX IF NOT EXISTS idx_user_roles_valid_until
ON public.user_roles(valid_until)
WHERE role_type = 'career';

-- Schritt 4: Kombinations-Index für Zeitraum-Abfragen
CREATE INDEX IF NOT EXISTS idx_user_roles_career_validity
ON public.user_roles(user_id, role_type, valid_from, valid_until)
WHERE role_type = 'career';

-- Kommentare
COMMENT ON COLUMN public.user_roles.valid_from IS 'Gültig ab Datum (für Karrierestufen)';
COMMENT ON COLUMN public.user_roles.valid_until IS 'Gültig bis Datum (NULL = unbegrenzt)';

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '✅ valid_from Spalte wurde zu user_roles hinzugefügt!';
    RAISE NOTICE '';
    RAISE NOTICE 'Karrierestufen können jetzt mit Von-Bis Zeitraum gespeichert werden.';
    RAISE NOTICE 'Wenn Bis abgelaufen ist und kein neuer Eintrag existiert,';
    RAISE NOTICE 'gilt der letzte Faktor automatisch weiter.';
END $$;
