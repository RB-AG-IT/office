-- ================================================================
-- FEHLENDE SPALTEN ZU USER_PROFILES HINZUFÜGEN
-- ================================================================
-- Fügt game_tag und photo URLs zu user_profiles hinzu
-- ================================================================

-- 1. GameTag Spalte hinzufügen
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS game_tag TEXT;

-- 2. Photo URL Spalten hinzufügen
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS photo_intern_url TEXT;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS photo_extern_url TEXT;

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SPALTEN HINZUGEFÜGT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Folgende Spalten wurden hinzugefügt:';
    RAISE NOTICE '  - game_tag (für Gaming-Tag)';
    RAISE NOTICE '  - photo_intern_url (internes Foto)';
    RAISE NOTICE '  - photo_extern_url (externes DRK Foto)';
    RAISE NOTICE '';
    RAISE NOTICE 'Jetzt können Sie:';
    RAISE NOTICE '  ✅ GameTags speichern';
    RAISE NOTICE '  ✅ Profilfotos hochladen';
    RAISE NOTICE '========================================';
END $$;
