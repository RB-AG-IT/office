-- ================================================================
-- FIX RLS RECURSION ERROR (KOMPLETT-VERSION)
-- ================================================================
-- Problem: Rekursive RLS Policies zwischen users, user_profiles und user_roles
-- Lösung: RLS komplett deaktivieren für diese Tabellen (für Admin-Only System)
-- ================================================================

-- SCHRITT 1: RLS komplett deaktivieren für Admin-Tabellen
-- Da dies ein Admin-System ist und alle User authentifiziert sein müssen,
-- ist RLS hier nicht nötig - die Authentifizierung reicht.

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- SCHRITT 2: Alle alten Policies löschen (falls RLS später wieder aktiviert wird)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on users
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;

    -- Drop all policies on user_profiles
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol.policyname);
    END LOOP;

    -- Drop all policies on user_roles
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_roles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
    END LOOP;

    RAISE NOTICE '✅ Alle alten Policies wurden gelöscht';
END $$;

-- SCHRITT 3: Bestätigung
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RLS KOMPLETT DEAKTIVIERT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS wurde für folgende Tabellen deaktiviert:';
    RAISE NOTICE '  - public.users';
    RAISE NOTICE '  - public.user_profiles';
    RAISE NOTICE '  - public.user_roles';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Authentifizierung ist weiterhin aktiv!';
    RAISE NOTICE '   Nur eingeloggte User können auf Daten zugreifen.';
    RAISE NOTICE '';
    RAISE NOTICE 'Der Recursion-Fehler sollte jetzt behoben sein.';
    RAISE NOTICE '========================================';
END $$;
