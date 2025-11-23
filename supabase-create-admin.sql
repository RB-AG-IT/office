-- ================================================================
-- CREATE ADMIN USER
-- ================================================================
-- Dieses Script erstellt einen vollständigen Admin-User:
-- 1. Auth User (mit Email/Passwort)
-- 2. Public Users Eintrag
-- 3. User Profile
-- 4. Admin-Rolle (Führungsebene)
--
-- WICHTIG: Passen Sie Email und Name an!
-- ================================================================

-- Schritt 1: Auth User anlegen (in Supabase Dashboard unter Authentication → Users)
-- Email: admin@rb-inside.com
-- Password: Admin123! (oder Ihr eigenes Passwort)
-- ✅ Auto Confirm User aktivieren!

-- Schritt 2: Nachdem der Auth-User erstellt wurde, kopieren Sie die User-ID
-- und ersetzen Sie 'IHRE-USER-ID-HIER' unten mit der echten UUID

-- ================================================================
-- WICHTIG: Ersetzen Sie diese Werte:
-- ================================================================
DO $$
DECLARE
    v_user_id UUID := 'IHRE-USER-ID-HIER'; -- ← Hier die User-ID aus dem Auth-User einfügen
    v_email TEXT := 'admin@rb-inside.com';  -- ← Ihre Admin-Email
    v_name TEXT := 'Admin User';             -- ← Ihr Name
    v_first_name TEXT := 'Admin';            -- ← Vorname
    v_last_name TEXT := 'User';              -- ← Nachname
BEGIN
    -- Insert into public.users
    -- WICHTIG: role='werber' ist nur ein Platzhalter
    -- Die echte Rolle wird in user_roles gespeichert!
    INSERT INTO public.users (id, email, name, role, created_at)
    VALUES (
        v_user_id,
        v_email,
        v_name,
        'werber',  -- Platzhalter-Wert (erlaubter Wert im Constraint)
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert into public.user_profiles
    INSERT INTO public.user_profiles (
        user_id,
        first_name,
        last_name,
        email,
        created_at
    )
    VALUES (
        v_user_id,
        v_first_name,
        v_last_name,
        v_email,
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Set main role to Führungsebene (highest level)
    INSERT INTO public.user_roles (
        user_id,
        role_type,
        role_name,
        is_active,
        assigned_at
    )
    VALUES (
        v_user_id,
        'main',
        'führungsebene',
        true,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Admin user successfully created!';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Role: führungsebene';
END $$;
