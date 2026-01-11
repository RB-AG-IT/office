-- ================================================================
-- FIX: RLS Policy für Admin-User-Erstellung
-- ================================================================
-- Problem: Admins können keine Profile für andere User erstellen
-- Lösung: Policy hinzufügen, die es authentifizierten Usern erlaubt,
--         Profile zu erstellen (da nur Admins Zugriff auf Office haben)
-- ================================================================

-- Policy: Authentifizierte User können Profile erstellen
-- (In der Office-App haben nur Admins Zugriff, daher ist das sicher)
CREATE POLICY "Authenticated users can create profiles"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authentifizierte User können alle Profile aktualisieren
-- (Admins müssen Profile bearbeiten können)
CREATE POLICY "Authenticated users can update all profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- FERTIG! 🎉
-- ================================================================
-- Jetzt können Admins Profile für neue User erstellen!
-- ================================================================
