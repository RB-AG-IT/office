-- ================================================================
-- DOKUMENT-SPALTEN ZU USER_PROFILES HINZUFÜGEN
-- ================================================================
-- Fügt Spalten für Personalausweis und Führerschein URLs hinzu
-- ================================================================

-- Personalausweis Vorderseite
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS id_front_url TEXT;

-- Personalausweis Rückseite
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS id_back_url TEXT;

-- Führerschein Vorderseite
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS license_front_url TEXT;

-- Führerschein Rückseite
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS license_back_url TEXT;

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DOKUMENT-SPALTEN HINZUGEFÜGT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Neue Spalten:';
    RAISE NOTICE '  - id_front_url (Personalausweis Vorderseite)';
    RAISE NOTICE '  - id_back_url (Personalausweis Rückseite)';
    RAISE NOTICE '  - license_front_url (Führerschein Vorderseite)';
    RAISE NOTICE '  - license_back_url (Führerschein Rückseite)';
    RAISE NOTICE '========================================';
END $$;
