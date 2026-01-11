-- ================================================================
-- BASE PORTAL - SUPABASE DATABASE SCHEMA
-- ================================================================
-- Vollständiges Setup für base.rb-inside.de
--
-- INSTALLATION:
-- 1. Öffne Supabase Dashboard → SQL Editor
-- 2. Copy-Paste dieses komplette Script
-- 3. Execute (Run)
--
-- Erstellt:
-- - 6 Tabellen (users, user_profiles, campaigns, werbegebiete, records, rankings)
-- - Row Level Security (RLS) Policies
-- - Indizes für Performance
-- - Trigger für Auto-Updates
-- ================================================================

-- ================================================================
-- 1. USERS TABELLE - Basis User-Daten
-- ================================================================
-- Verknüpft mit Supabase Auth (auth.users)
-- Erweitert Auth-Daten um App-spezifische Felder

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'werber' CHECK (role IN ('werber', 'teamleiter', 'admin', 'quality')),
  avatar_url TEXT,
  active_area_id UUID, -- Wird später mit werbegebiete verknüpft
  active_campaign_id UUID, -- Wird später mit campaigns verknüpft
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

COMMENT ON TABLE public.users IS 'Basis User-Daten, verknüpft mit Supabase Auth';
COMMENT ON COLUMN public.users.role IS 'Rolle: werber, teamleiter, admin, quality';
COMMENT ON COLUMN public.users.active_area_id IS 'Aktuell ausgewähltes Werbegebiet';
COMMENT ON COLUMN public.users.active_campaign_id IS 'Aktuell ausgewählte Kampagne';


-- ================================================================
-- 2. USER_PROFILES TABELLE - Erweiterte Profil-Daten
-- ================================================================
-- Alle Felder aus dem Profil-Formular (profil.html)

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

  -- Persönliche Daten
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  birth_place TEXT,
  phone TEXT,

  -- Adresse
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'DE',

  -- Bankdaten
  iban TEXT,
  bic TEXT,
  bank_name TEXT,
  account_holder TEXT,

  -- Steuerinformationen
  tax_id TEXT, -- Steueridentifikationsnummer (TIN)
  tax_number TEXT, -- Steuernummer
  tax_office TEXT, -- Finanzamt

  -- Sonstiges
  clothing_size TEXT CHECK (clothing_size IN ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL')),

  -- Sichtbarkeits-Einstellungen
  is_ghost BOOLEAN DEFAULT false,           -- Ghost-Modus: Nur Office sieht diesen Mitarbeiter
  can_see_others BOOLEAN DEFAULT true,      -- Ob Ghost-Mitarbeiter andere sehen darf
  participate_ranking BOOLEAN DEFAULT true, -- Teilnahme am Base-Ranking

  -- Dokumente & Fotos (URLs zu Supabase Storage)
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  license_front_url TEXT,
  license_back_url TEXT,
  photo_url TEXT,
  photo_additional_url TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_user_profiles_postal_code ON public.user_profiles(postal_code);
CREATE INDEX idx_user_profiles_city ON public.user_profiles(city);

COMMENT ON TABLE public.user_profiles IS 'Erweiterte Profil-Daten für Users (Formular-Daten)';


-- ================================================================
-- 3. CAMPAIGNS TABELLE - Kampagnen
-- ================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_dates ON public.campaigns(start_date, end_date);

COMMENT ON TABLE public.campaigns IS 'Werbe-Kampagnen';


-- ================================================================
-- 4. WERBEGEBIETE TABELLE - Werbegebiete/Areas
-- ================================================================

CREATE TABLE IF NOT EXISTS public.werbegebiete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,

  -- Gebiet
  plz TEXT NOT NULL,
  ort TEXT NOT NULL,

  -- Status & Progress
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Zähler
  records_total INT DEFAULT 0,
  records_done INT DEFAULT 0,

  -- Teamleiter
  teamleiter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_werbegebiete_campaign ON public.werbegebiete(campaign_id);
CREATE INDEX idx_werbegebiete_plz ON public.werbegebiete(plz);
CREATE INDEX idx_werbegebiete_status ON public.werbegebiete(status);
CREATE INDEX idx_werbegebiete_teamleiter ON public.werbegebiete(teamleiter_id);

COMMENT ON TABLE public.werbegebiete IS 'Werbegebiete mit PLZ/Ort und Progress-Tracking';


-- Jetzt können wir die Foreign Keys in users setzen
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_active_area
  FOREIGN KEY (active_area_id)
  REFERENCES public.werbegebiete(id)
  ON DELETE SET NULL;

ALTER TABLE public.users
  ADD CONSTRAINT fk_users_active_campaign
  FOREIGN KEY (active_campaign_id)
  REFERENCES public.campaigns(id)
  ON DELETE SET NULL;


-- ================================================================
-- 5. RECORDS TABELLE - Erfassungen
-- ================================================================

CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationen
  werber_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.werbegebiete(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'pending', 'error')),
  synced BOOLEAN DEFAULT false,

  -- Formular-Daten (flexibles JSON für Erfassungsformular)
  data JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_records_werber ON public.records(werber_id);
CREATE INDEX idx_records_area ON public.records(area_id);
CREATE INDEX idx_records_campaign ON public.records(campaign_id);
CREATE INDEX idx_records_status ON public.records(status);
CREATE INDEX idx_records_synced ON public.records(synced);
CREATE INDEX idx_records_created_at ON public.records(created_at DESC);

COMMENT ON TABLE public.records IS 'Erfassungen von Werbern (mit flexiblen JSONB-Daten)';


-- ================================================================
-- 6. RANKINGS TABELLE - Leaderboard
-- ================================================================

CREATE TABLE IF NOT EXISTS public.rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Periode
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,

  -- Ranking-Daten
  score INT DEFAULT 0,
  rank INT,
  trend TEXT CHECK (trend IN ('up', 'down', 'same', NULL)),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ein User kann pro Periode nur einen Eintrag haben
  UNIQUE(user_id, period, period_start)
);

-- Indizes
CREATE INDEX idx_rankings_period ON public.rankings(period, period_start);
CREATE INDEX idx_rankings_user ON public.rankings(user_id);
CREATE INDEX idx_rankings_rank ON public.rankings(period, rank);

COMMENT ON TABLE public.rankings IS 'Leaderboard/Rankings für verschiedene Zeitperioden';


-- ================================================================
-- TRIGGER: Auto-Update Timestamps
-- ================================================================

-- Function für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_werbegebiete_updated_at BEFORE UPDATE ON public.werbegebiete
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_records_updated_at BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at BEFORE UPDATE ON public.rankings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ================================================================
-- ROW LEVEL SECURITY (RLS) - AKTIVIERUNG
-- ================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.werbegebiete ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- RLS POLICIES - USERS
-- ================================================================

-- Jeder kann sein eigenes Profil sehen
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Jeder kann sein eigenes Profil updaten
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Admins können alle User sehen
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teamleiter können ihre Team-Mitglieder sehen
CREATE POLICY "Teamleiter can view team members"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'teamleiter'
        AND u.active_campaign_id = users.active_campaign_id
    )
  );


-- ================================================================
-- RLS POLICIES - USER_PROFILES
-- ================================================================

-- User kann eigenes Profil sehen
CREATE POLICY "Users can view own profile data"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- User kann eigenes Profil bearbeiten
CREATE POLICY "Users can update own profile data"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User kann eigenes Profil erstellen
CREATE POLICY "Users can insert own profile data"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins können alle Profile sehen
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ================================================================
-- RLS POLICIES - CAMPAIGNS
-- ================================================================

-- Jeder eingeloggte User kann Kampagnen sehen
CREATE POLICY "Authenticated users can view campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Nur Admins können Kampagnen erstellen/bearbeiten/löschen
CREATE POLICY "Admins can manage campaigns"
  ON public.campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ================================================================
-- RLS POLICIES - WERBEGEBIETE
-- ================================================================

-- Jeder eingeloggte User kann Werbegebiete sehen
CREATE POLICY "Authenticated users can view werbegebiete"
  ON public.werbegebiete FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Nur Admins und Teamleiter können Werbegebiete bearbeiten
CREATE POLICY "Admins and Teamleiter can manage werbegebiete"
  ON public.werbegebiete FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'teamleiter')
    )
  );


-- ================================================================
-- RLS POLICIES - RECORDS
-- ================================================================

-- User können ihre eigenen Records sehen
CREATE POLICY "Users can view own records"
  ON public.records FOR SELECT
  USING (auth.uid() = werber_id);

-- User können eigene Records erstellen
CREATE POLICY "Users can insert own records"
  ON public.records FOR INSERT
  WITH CHECK (auth.uid() = werber_id);

-- User können eigene Records bearbeiten
CREATE POLICY "Users can update own records"
  ON public.records FOR UPDATE
  USING (auth.uid() = werber_id);

-- Quality Manager können alle Records sehen
CREATE POLICY "Quality managers can view all records"
  ON public.records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'quality'
    )
  );

-- Teamleiter können Records ihrer Kampagne sehen
CREATE POLICY "Teamleiter can view campaign records"
  ON public.records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'teamleiter'
        AND u.active_campaign_id = records.campaign_id
    )
  );

-- Admins können alle Records sehen
CREATE POLICY "Admins can view all records"
  ON public.records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ================================================================
-- RLS POLICIES - RANKINGS
-- ================================================================

-- Jeder eingeloggte User kann Rankings sehen
CREATE POLICY "Authenticated users can view rankings"
  ON public.rankings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Nur das System (oder Admins) können Rankings schreiben
CREATE POLICY "Only admins can manage rankings"
  ON public.rankings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function: User beim ersten Login automatisch in users-Tabelle eintragen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Neuer User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'werber')
  );

  -- Leeres Profil erstellen
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Bei neuem Auth-User automatisch users + user_profiles erstellen
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ================================================================
-- FERTIG! 🎉
-- ================================================================
--
-- NÄCHSTE SCHRITTE:
-- 1. ✅ Tabellen erstellt
-- 2. ✅ RLS aktiviert
-- 3. ✅ Policies eingerichtet
-- 4. → Jetzt: Test-Daten einfügen (siehe nächstes Script)
-- 5. → Dann: Supabase Client im Frontend einbinden
--
-- ================================================================
