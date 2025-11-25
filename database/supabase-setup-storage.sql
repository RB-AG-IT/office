-- ================================================================
-- STORAGE BUCKET FÜR PROFILBILDER EINRICHTEN
-- ================================================================
-- Erstellt einen Storage Bucket für Mitarbeiter-Fotos
-- (Intern und Extern/DRK)
-- ================================================================

-- Bucket erstellen (falls noch nicht vorhanden)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Jeder authentifizierte User kann Fotos hochladen
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Storage Policy: Jeder kann Fotos anschauen (public bucket)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Storage Policy: Authentifizierte User können eigene Fotos aktualisieren
CREATE POLICY "Authenticated users can update profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Storage Policy: Authentifizierte User können Fotos löschen
CREATE POLICY "Authenticated users can delete profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ STORAGE BUCKET EINGERICHTET';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Bucket-Name: profile-photos';
    RAISE NOTICE 'Öffentlich: Ja (Bilder können angezeigt werden)';
    RAISE NOTICE 'Upload: Nur für eingeloggte User';
    RAISE NOTICE '';
    RAISE NOTICE 'Die Fotos werden gespeichert als:';
    RAISE NOTICE '  - {user_id}/photo-intern.jpg';
    RAISE NOTICE '  - {user_id}/photo-extern.jpg';
    RAISE NOTICE '========================================';
END $$;
