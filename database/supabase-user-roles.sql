-- ================================================================
-- USER ROLES - ERWEITERUNG FÜR FLEXIBLES ROLLEN-SYSTEM
-- ================================================================
-- Fügt eine separate Tabelle für Rollen hinzu (Option C)
--
-- ROLLEN-SYSTEM:
-- 1. HAUPT-ROLLE (main) - NUR EINE pro User:
--    - junior_marketing_manager (erste 4 Wochen)
--    - senior_marketing_manager (nach 4 Wochen)
--    - spitzenbotschafter
--    - kader_manager
--    - führungsebene
--
-- 2. ZUSATZ-ROLLEN (additional) - MEHRERE möglich:
--    - quality_manager
--    - teamleiter
--    - recruiting_manager
--
-- INSTALLATION:
-- 1. Führe zuerst supabase-schema.sql aus (falls noch nicht geschehen)
-- 2. Dann dieses Script ausführen
-- ================================================================

-- ================================================================
-- 1. USER_ROLES TABELLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Rollen-Typ und Name
  role_type TEXT NOT NULL CHECK (role_type IN ('main', 'additional')),
  role_name TEXT NOT NULL,

  -- Metadaten (für später)
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  valid_until DATE, -- Optional: Ablaufdatum
  is_active BOOLEAN DEFAULT true,

  -- Kampagnen-Zuordnung (für Teamleiter)
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,

  -- Notizen
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: Ein User kann nur EINE Haupt-Rolle haben
  UNIQUE(user_id, role_type, role_name)
);

-- Indizes für Performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_type ON public.user_roles(role_type);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX idx_user_roles_campaign ON public.user_roles(campaign_id) WHERE campaign_id IS NOT NULL;

COMMENT ON TABLE public.user_roles IS 'Flexibles Rollen-System mit Haupt- und Zusatz-Rollen';
COMMENT ON COLUMN public.user_roles.role_type IS 'main = Haupt-Rolle (nur 1), additional = Zusatz-Rolle (mehrere)';
COMMENT ON COLUMN public.user_roles.campaign_id IS 'Nur für Teamleiter: Welcher Kampagne zugeordnet?';


-- ================================================================
-- 2. TRIGGER: Auto-Update updated_at
-- ================================================================

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ================================================================
-- 3. CONSTRAINT: Nur EINE Haupt-Rolle pro User
-- ================================================================

-- Function: Prüft, dass ein User nur eine aktive Haupt-Rolle hat
CREATE OR REPLACE FUNCTION check_single_main_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur bei Haupt-Rollen prüfen
  IF NEW.role_type = 'main' AND NEW.is_active = true THEN
    -- Gibt es bereits eine aktive Haupt-Rolle für diesen User?
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = NEW.user_id
        AND role_type = 'main'
        AND is_active = true
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Ein Mitarbeiter kann nur eine aktive Haupt-Rolle haben!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Vor INSERT/UPDATE prüfen
CREATE TRIGGER enforce_single_main_role
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION check_single_main_role();


-- ================================================================
-- 4. RLS POLICIES
-- ================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User können ihre eigenen Rollen sehen
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins können alle Rollen sehen
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.users u ON u.id = ur.user_id
      WHERE ur.user_id = auth.uid()
        AND ur.role_name = 'admin'
        AND ur.is_active = true
    )
  );

-- Nur Admins können Rollen verwalten
CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_name = 'admin'
        AND ur.is_active = true
    )
  );


-- ================================================================
-- 5. HELPER FUNCTIONS
-- ================================================================

-- Function: Holt alle Rollen eines Users
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
  main_role TEXT,
  additional_roles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT role_name FROM public.user_roles
     WHERE user_id = p_user_id
       AND role_type = 'main'
       AND is_active = true
     LIMIT 1) as main_role,
    ARRAY(SELECT role_name FROM public.user_roles
          WHERE user_id = p_user_id
            AND role_type = 'additional'
            AND is_active = true) as additional_roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Setzt die Haupt-Rolle eines Users (deaktiviert alte)
CREATE OR REPLACE FUNCTION set_main_role(
  p_user_id UUID,
  p_role_name TEXT,
  p_assigned_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Alte Haupt-Rolle deaktivieren
  UPDATE public.user_roles
  SET is_active = false
  WHERE user_id = p_user_id
    AND role_type = 'main'
    AND is_active = true;

  -- Neue Haupt-Rolle einfügen
  INSERT INTO public.user_roles (user_id, role_type, role_name, assigned_by)
  VALUES (p_user_id, 'main', p_role_name, p_assigned_by)
  RETURNING id INTO v_role_id;

  RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Fügt eine Zusatz-Rolle hinzu
CREATE OR REPLACE FUNCTION add_additional_role(
  p_user_id UUID,
  p_role_name TEXT,
  p_campaign_id UUID DEFAULT NULL,
  p_assigned_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Prüfen ob bereits vorhanden
  SELECT id INTO v_role_id
  FROM public.user_roles
  WHERE user_id = p_user_id
    AND role_type = 'additional'
    AND role_name = p_role_name
    AND is_active = true;

  -- Falls bereits vorhanden, nur updaten
  IF v_role_id IS NOT NULL THEN
    UPDATE public.user_roles
    SET campaign_id = COALESCE(p_campaign_id, campaign_id),
        assigned_by = COALESCE(p_assigned_by, assigned_by),
        assigned_at = NOW()
    WHERE id = v_role_id;

    RETURN v_role_id;
  END IF;

  -- Sonst neu einfügen
  INSERT INTO public.user_roles (user_id, role_type, role_name, campaign_id, assigned_by)
  VALUES (p_user_id, 'additional', p_role_name, p_campaign_id, p_assigned_by)
  RETURNING id INTO v_role_id;

  RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Entfernt eine Zusatz-Rolle
CREATE OR REPLACE FUNCTION remove_additional_role(
  p_user_id UUID,
  p_role_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_roles
  SET is_active = false
  WHERE user_id = p_user_id
    AND role_type = 'additional'
    AND role_name = p_role_name
    AND is_active = true;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================================
-- 6. VIEWS FÜR EINFACHE ABFRAGEN
-- ================================================================

-- View: User mit ihren aktuellen Rollen
CREATE OR REPLACE VIEW user_with_roles AS
SELECT
  u.id,
  u.email,
  u.name,
  (SELECT role_name FROM public.user_roles
   WHERE user_id = u.id
     AND role_type = 'main'
     AND is_active = true
   LIMIT 1) as main_role,
  ARRAY(SELECT role_name FROM public.user_roles
        WHERE user_id = u.id
          AND role_type = 'additional'
          AND is_active = true) as additional_roles,
  u.created_at
FROM public.users u;

COMMENT ON VIEW user_with_roles IS 'Vereinfachte View: User mit ihren aktuellen Haupt- und Zusatz-Rollen';


-- ================================================================
-- 7. BEISPIEL-DATEN (Optional)
-- ================================================================

-- Beispiel: Admin-Rolle für ersten User setzen
-- WICHTIG: Ersetze USER_ID mit echter ID aus auth.users!
/*
-- Beispiel auskommentiert:
INSERT INTO public.user_roles (user_id, role_type, role_name) VALUES
  ('USER_ID_HIER', 'main', 'admin');
*/


-- ================================================================
-- FERTIG! 🎉
-- ================================================================
--
-- NÄCHSTE SCHRITTE:
-- 1. ✅ user_roles Tabelle erstellt
-- 2. ✅ Constraints und Trigger aktiviert
-- 3. ✅ RLS Policies eingerichtet
-- 4. ✅ Helper Functions erstellt
-- 5. → Frontend anpassen (profil.html + index.html)
--
-- VERWENDUNG IM FRONTEND:
--
-- // Haupt-Rolle setzen:
-- await supabase.rpc('set_main_role', {
--   p_user_id: 'uuid',
--   p_role_name: 'senior_marketing_manager'
-- });
--
-- // Zusatz-Rolle hinzufügen:
-- await supabase.rpc('add_additional_role', {
--   p_user_id: 'uuid',
--   p_role_name: 'quality_manager'
-- });
--
-- // Alle Rollen laden:
-- const { data } = await supabase
--   .from('user_with_roles')
--   .select('*')
--   .eq('id', userId);
--
-- ================================================================
