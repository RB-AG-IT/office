-- Migration: Platinum Prime Mitglied Felder
-- Datum: 2026-01-17

-- PPM-Felder zu user_profiles hinzufügen
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS platinum_prime_start DATE,
ADD COLUMN IF NOT EXISTS platinum_prime_end DATE;

-- Kommentar für Dokumentation
COMMENT ON COLUMN public.user_profiles.platinum_prime_start IS 'Startdatum der Platinum Prime Mitgliedschaft';
COMMENT ON COLUMN public.user_profiles.platinum_prime_end IS 'Enddatum der Platinum Prime Mitgliedschaft';
