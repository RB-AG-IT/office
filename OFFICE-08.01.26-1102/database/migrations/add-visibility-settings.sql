-- ================================================================
-- MIGRATION: Sichtbarkeits-Einstellungen für Mitarbeiter
-- ================================================================
-- Führe dieses Script aus, um die neuen Felder hinzuzufügen
-- für: Ghost-Modus, Sichtbarkeit anderer, Ranking-Teilnahme
-- ================================================================

-- Neue Spalten zu user_profiles hinzufügen
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS can_see_others BOOLEAN DEFAULT true;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS participate_ranking BOOLEAN DEFAULT true;

-- Kommentare für Dokumentation
COMMENT ON COLUMN public.user_profiles.is_ghost IS 'Ghost-Modus: Mitarbeiter ist nur für Office sichtbar';
COMMENT ON COLUMN public.user_profiles.can_see_others IS 'Ob dieser Mitarbeiter (Ghost) andere Mitarbeiter sehen kann';
COMMENT ON COLUMN public.user_profiles.participate_ranking IS 'Ob Mitarbeiter im Base-Ranking angezeigt wird';

-- ================================================================
-- FERTIG!
-- ================================================================
