-- ================================================================
-- BASE PORTAL - TEST-DATEN
-- ================================================================
-- Fügt Demo-Daten ein zum Testen der App
--
-- WICHTIG: Erst NACH supabase-schema.sql ausführen!
--
-- INSTALLATION:
-- 1. Zuerst supabase-schema.sql ausführen
-- 2. Mindestens 1 User über Supabase Auth registrieren
-- 3. Dann dieses Script ausführen
-- ================================================================

-- ================================================================
-- 1. KAMPAGNEN
-- ================================================================

INSERT INTO public.campaigns (id, name, status, start_date, end_date) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Frühjahrs-Kampagne 2024', 'active', '2024-01-15', '2024-06-30'),
  ('00000000-0000-0000-0000-000000000002', 'Sommer-Kampagne 2024', 'active', '2024-06-01', '2024-09-30'),
  ('00000000-0000-0000-0000-000000000003', 'Herbst-Kampagne 2024', 'paused', '2024-09-01', '2024-12-31')
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 2. WERBEGEBIETE
-- ================================================================

INSERT INTO public.werbegebiete (id, campaign_id, plz, ort, status, progress, records_total, records_done) VALUES
  -- Frühjahrs-Kampagne
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10115', 'Berlin-Mitte', 'active', 45, 100, 45),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20095', 'Hamburg-Altstadt', 'active', 67, 150, 100),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '80331', 'München-Altstadt', 'active', 23, 200, 46),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '50667', 'Köln-Innenstadt', 'active', 89, 120, 107),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '60311', 'Frankfurt-Innenstadt', 'completed', 100, 80, 80),

  -- Sommer-Kampagne
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '70173', 'Stuttgart-Mitte', 'active', 34, 90, 31),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '40210', 'Düsseldorf-Stadtmitte', 'active', 56, 110, 62),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', '04109', 'Leipzig-Zentrum', 'active', 12, 75, 9),

  -- Herbst-Kampagne (pausiert)
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', '01067', 'Dresden-Altstadt', 'inactive', 0, 100, 0)
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 3. DEMO RECORDS
-- ================================================================
-- WICHTIG: Hier musst du eine echte User-ID aus auth.users einfügen!
-- Nach der ersten Registrierung kannst du die ID so abfragen:
--
-- SELECT id, email FROM auth.users;
--
-- Dann unten die USER_ID_HIER_EINFÜGEN ersetzen!
-- ================================================================

-- Beispiel (auskommentiert, bis du eine echte User-ID hast):
/*
INSERT INTO public.records (werber_id, area_id, campaign_id, status, synced, data) VALUES
  ('USER_ID_HIER_EINFÜGEN', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'success', true, '{"name": "Max Mustermann", "email": "max@example.com"}'),
  ('USER_ID_HIER_EINFÜGEN', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'success', true, '{"name": "Anna Schmidt", "email": "anna@example.com"}'),
  ('USER_ID_HIER_EINFÜGEN', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'pending', false, '{"name": "Peter Müller", "email": "peter@example.com"}');
*/


-- ================================================================
-- 4. DEMO RANKINGS
-- ================================================================
-- WICHTIG: Auch hier echte User-IDs einfügen!
-- ================================================================

-- Beispiel (auskommentiert):
/*
INSERT INTO public.rankings (user_id, period, period_start, score, rank, trend) VALUES
  ('USER_ID_HIER_EINFÜGEN', 'daily', CURRENT_DATE, 23, 1, 'up'),
  ('USER_ID_HIER_EINFÜGEN', 'weekly', DATE_TRUNC('week', CURRENT_DATE)::DATE, 156, 2, 'up'),
  ('USER_ID_HIER_EINFÜGEN', 'monthly', DATE_TRUNC('month', CURRENT_DATE)::DATE, 487, 5, 'same'),
  ('USER_ID_HIER_EINFÜGEN', 'yearly', DATE_TRUNC('year', CURRENT_DATE)::DATE, 2341, 3, 'down');
*/


-- ================================================================
-- HELPER: User-IDs anzeigen
-- ================================================================
-- Führe diese Query aus, um alle registrierten User-IDs zu sehen:

SELECT
  u.id,
  u.email,
  users.name,
  users.role
FROM auth.users u
LEFT JOIN public.users ON users.id = u.id
ORDER BY u.created_at DESC;


-- ================================================================
-- FERTIG! 🎉
-- ================================================================
--
-- NÄCHSTE SCHRITTE:
-- 1. Registriere 1-2 Test-User über die App
-- 2. Kopiere die User-IDs aus der obigen Query
-- 3. Füge Records und Rankings mit echten IDs ein
-- 4. Teste die App mit echten Daten!
--
-- ================================================================
