-- ================================================================
-- FIX RLS RECURSION ERROR
-- ================================================================
-- Problem: Die users Tabelle hat RLS Policies die sich selbst
-- referenzieren und dadurch eine Endlosschleife erzeugen.
--
-- Lösung: Policies vereinfachen und direkt auth.uid() nutzen
-- ================================================================

-- 1. Alle bestehenden Policies auf users löschen
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON public.users;
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON public.users;

-- 2. Neue, einfache Policies erstellen (OHNE Recursion)

-- Alle authentifizierten User können alle User LESEN
CREATE POLICY "Authenticated users can read all users"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

-- Alle authentifizierten User können User ERSTELLEN
-- (benötigt für addEmployee() Funktion)
CREATE POLICY "Authenticated users can insert users"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- User können ihren eigenen Eintrag AKTUALISIEREN
CREATE POLICY "Users can update own record"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Optional: Admins können alles aktualisieren
-- (wenn Sie später Admin-Rechte implementieren möchten)
CREATE POLICY "Admins can update all users"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role_name = 'führungsebene'
            AND user_roles.is_active = true
        )
    );

-- Bestätigung
DO $$
BEGIN
    RAISE NOTICE '✅ RLS Policies für users-Tabelle wurden repariert!';
    RAISE NOTICE 'Die Recursion sollte jetzt behoben sein.';
END $$;
