-- ================================================================
-- BUCKET UMBENENNEN: profile-photos -> user-files
-- ================================================================
-- Da Buckets nicht direkt umbenannt werden können, erstellen wir
-- einen neuen Bucket und migrieren die Policies.
-- ================================================================

-- 1. Neuen Bucket erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies für neuen Bucket erstellen

-- Upload Policy
CREATE POLICY "Authenticated users can upload to user-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-files');

-- View Policy (öffentlich)
CREATE POLICY "Anyone can view user-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-files');

-- Update Policy
CREATE POLICY "Authenticated users can update user-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-files');

-- Delete Policy
CREATE POLICY "Authenticated users can delete user-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-files');

-- ================================================================
-- HINWEIS: Nach Ausführen dieses Skripts:
-- 1. Bestehende Dateien manuell von 'profile-photos' nach
--    'user-files' verschieben (falls gewünscht)
-- 2. Oder: URLs in user_profiles aktualisieren
-- 3. Alten Bucket 'profile-photos' löschen (optional)
-- ================================================================

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEUER BUCKET ERSTELLT: user-files';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Policies erstellt für:';
    RAISE NOTICE '  - Upload (authenticated)';
    RAISE NOTICE '  - View (public)';
    RAISE NOTICE '  - Update (authenticated)';
    RAISE NOTICE '  - Delete (authenticated)';
    RAISE NOTICE '';
    RAISE NOTICE 'Nächste Schritte:';
    RAISE NOTICE '  1. Alte Dateien migrieren (optional)';
    RAISE NOTICE '  2. Alten Bucket löschen (optional)';
    RAISE NOTICE '========================================';
END $$;
