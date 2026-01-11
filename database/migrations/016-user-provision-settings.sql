-- ============================================================================
-- Migration 016: User Provision Settings
-- ============================================================================

-- 1. Neue Tabelle erstellen
CREATE TABLE IF NOT EXISTS public.user_provision_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,

  -- Vorschuss/Stornorücklage (synchronisiert mit user_profiles)
  vorschuss_anteil integer NOT NULL DEFAULT 70,
  stornorucklage_anteil integer NOT NULL DEFAULT 30,

  -- Werben (eigene Provision)
  -- NULL = Standard aus Karrierestufe (ROLE_CONFIG), Wert = individueller Faktor
  werben_faktor numeric,

  -- TC (Teamleitung)
  tc_faktor numeric NOT NULL DEFAULT 1.0,
  tc_mind_eh integer NOT NULL DEFAULT 100,

  -- Empfehlung/Recruiting
  empfehlung_faktor numeric NOT NULL DEFAULT 0.5,
  empfehlung_mind_eh integer,          -- ENTWEDER mind. EH
  empfehlung_mind_tage integer,        -- ODER mind. Anwesenheitstage
  empfehlung_zeitraum_monate integer NOT NULL DEFAULT 12,

  -- Quality
  quality_faktor numeric NOT NULL DEFAULT 0.5,
  quality_eh_durchschnitt integer NOT NULL DEFAULT 50,

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT user_provision_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_provision_settings_user_id_key UNIQUE (user_id),
  CONSTRAINT user_provision_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,

  -- Check: vorschuss + stornorucklage = 100
  CONSTRAINT user_provision_settings_anteil_check CHECK (vorschuss_anteil + stornorucklage_anteil = 100),

  -- Check: Entweder mind_eh ODER mind_tage, nicht beide
  CONSTRAINT user_provision_settings_empfehlung_check CHECK (
    (empfehlung_mind_eh IS NULL AND empfehlung_mind_tage IS NULL) OR
    (empfehlung_mind_eh IS NOT NULL AND empfehlung_mind_tage IS NULL) OR
    (empfehlung_mind_eh IS NULL AND empfehlung_mind_tage IS NOT NULL)
  )
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_user_provision_settings_user_id
ON public.user_provision_settings(user_id);

-- RLS aktivieren
ALTER TABLE public.user_provision_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own provision settings"
ON public.user_provision_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all provision settings"
ON public.user_provision_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'fue')
    AND is_active = true
  )
);

CREATE POLICY "Admins can insert provision settings"
ON public.user_provision_settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'fue')
    AND is_active = true
  )
);

CREATE POLICY "Admins can update provision settings"
ON public.user_provision_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'fue')
    AND is_active = true
  )
);

-- Service Role kann alles
CREATE POLICY "Service role full access"
ON public.user_provision_settings FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 2. Bestehende Daten migrieren
-- ============================================================================

-- Für jeden User in users (role='werber') einen Eintrag erstellen
INSERT INTO public.user_provision_settings (user_id, vorschuss_anteil, stornorucklage_anteil, werben_faktor)
SELECT
  u.id as user_id,
  COALESCE(p.advance_rate, 70) as vorschuss_anteil,
  COALESCE(p.reserve_rate, 30) as stornorucklage_anteil,
  r.factor as werben_faktor  -- NULL wenn kein individueller Faktor
FROM public.users u
LEFT JOIN public.user_profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
  AND r.role_type = 'career'
  AND r.is_active = true
WHERE u.role = 'werber'
ON CONFLICT (user_id) DO UPDATE SET
  vorschuss_anteil = EXCLUDED.vorschuss_anteil,
  stornorucklage_anteil = EXCLUDED.stornorucklage_anteil,
  werben_faktor = EXCLUDED.werben_faktor,
  updated_at = now();

-- ============================================================================
-- 3. Synchronisations-Trigger
-- ============================================================================

-- 3a. Trigger: user_profiles → user_provision_settings
-- Wenn advance_rate oder reserve_rate in user_profiles geändert wird

CREATE OR REPLACE FUNCTION sync_profiles_to_provision_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur wenn advance_rate oder reserve_rate geändert wurde
  IF (TG_OP = 'UPDATE' AND
      (OLD.advance_rate IS DISTINCT FROM NEW.advance_rate OR
       OLD.reserve_rate IS DISTINCT FROM NEW.reserve_rate)) THEN

    INSERT INTO public.user_provision_settings (user_id, vorschuss_anteil, stornorucklage_anteil)
    VALUES (NEW.user_id, COALESCE(NEW.advance_rate, 70), COALESCE(NEW.reserve_rate, 30))
    ON CONFLICT (user_id) DO UPDATE SET
      vorschuss_anteil = COALESCE(NEW.advance_rate, 70),
      stornorucklage_anteil = COALESCE(NEW.reserve_rate, 30),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profiles_to_provision ON public.user_profiles;
CREATE TRIGGER trigger_sync_profiles_to_provision
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profiles_to_provision_settings();


-- 3b. Trigger: user_provision_settings → user_profiles
-- Wenn vorschuss_anteil oder stornorucklage_anteil geändert wird

CREATE OR REPLACE FUNCTION sync_provision_settings_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles
  UPDATE public.user_profiles
  SET
    advance_rate = NEW.vorschuss_anteil,
    reserve_rate = NEW.stornorucklage_anteil,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Falls kein Profil existiert, erstellen
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (user_id, advance_rate, reserve_rate)
    VALUES (NEW.user_id, NEW.vorschuss_anteil, NEW.stornorucklage_anteil);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_provision_to_profiles ON public.user_provision_settings;
CREATE TRIGGER trigger_sync_provision_to_profiles
  AFTER INSERT OR UPDATE ON public.user_provision_settings
  FOR EACH ROW
  EXECUTE FUNCTION sync_provision_settings_to_profiles();


-- 3c. Trigger: user_roles (career) → user_provision_settings
-- Wenn factor in user_roles geändert wird (nur bei career roles)

CREATE OR REPLACE FUNCTION sync_roles_to_provision_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur bei career roles
  IF NEW.role_type = 'career' AND NEW.is_active = true THEN
    INSERT INTO public.user_provision_settings (user_id, werben_faktor)
    VALUES (NEW.user_id, NEW.factor)
    ON CONFLICT (user_id) DO UPDATE SET
      werben_faktor = NEW.factor,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_roles_to_provision ON public.user_roles;
CREATE TRIGGER trigger_sync_roles_to_provision
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_roles_to_provision_settings();


-- 3d. Trigger: user_provision_settings → user_roles
-- Wenn werben_faktor geändert wird

CREATE OR REPLACE FUNCTION sync_provision_settings_to_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Update aktive career role
  UPDATE public.user_roles
  SET
    factor = NEW.werben_faktor,
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND role_type = 'career'
    AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_provision_to_roles ON public.user_provision_settings;
CREATE TRIGGER trigger_sync_provision_to_roles
  AFTER UPDATE ON public.user_provision_settings
  FOR EACH ROW
  WHEN (OLD.werben_faktor IS DISTINCT FROM NEW.werben_faktor)
  EXECUTE FUNCTION sync_provision_settings_to_roles();


-- 3e. Trigger: Neuer User → automatisch provision_settings erstellen

CREATE OR REPLACE FUNCTION create_provision_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'werber' THEN
    INSERT INTO public.user_provision_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_provision_settings ON public.users;
CREATE TRIGGER trigger_create_provision_settings
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_provision_settings_for_new_user();
