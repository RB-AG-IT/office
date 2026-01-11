-- ================================================================
-- KAMPAGNEN ERWEITERUNG - Office Backoffice
-- ================================================================
-- Erweitert die Kampagnen-Funktionalität für das Office
--
-- INSTALLATION:
-- Option A: supabase db push (lokal)
-- Option B: Copy-Paste in Supabase Dashboard → SQL Editor
-- ================================================================

-- ================================================================
-- 1. CAMPAIGNS TABELLE ERWEITERN
-- ================================================================

-- Neue Spalten hinzufügen (falls Tabelle existiert)
DO $$
BEGIN
    -- year
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'year') THEN
        ALTER TABLE public.campaigns ADD COLUMN year INTEGER;
    END IF;

    -- kw_from (Kalenderwoche Start)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'kw_from') THEN
        ALTER TABLE public.campaigns ADD COLUMN kw_from INTEGER CHECK (kw_from >= 1 AND kw_from <= 53);
    END IF;

    -- kw_to (Kalenderwoche Ende)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'kw_to') THEN
        ALTER TABLE public.campaigns ADD COLUMN kw_to INTEGER CHECK (kw_to >= 1 AND kw_to <= 53);
    END IF;

    -- customer_id (Verknüpfung zu customers)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'customer_id') THEN
        ALTER TABLE public.campaigns ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;

    -- puffer_percent (Abrechnungseinstellung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'puffer_percent') THEN
        ALTER TABLE public.campaigns ADD COLUMN puffer_percent INTEGER DEFAULT 10;
    END IF;

    -- wartezeit_wochen (Abrechnungseinstellung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaigns' AND column_name = 'wartezeit_wochen') THEN
        ALTER TABLE public.campaigns ADD COLUMN wartezeit_wochen INTEGER DEFAULT 4;
    END IF;
END $$;

-- Index für Jahr
CREATE INDEX IF NOT EXISTS idx_campaigns_year ON public.campaigns(year);
CREATE INDEX IF NOT EXISTS idx_campaigns_customer ON public.campaigns(customer_id);


-- ================================================================
-- 2. CAMPAIGN_AREAS - Einsatzgebiete pro Kampagne
-- ================================================================
-- Verknüpft Kampagnen mit customer_areas

CREATE TABLE IF NOT EXISTS public.campaign_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    customer_area_id UUID REFERENCES public.customer_areas(id) ON DELETE SET NULL,

    -- Fallback wenn kein customer_area verknüpft (manuell angelegte Gebiete)
    name TEXT,
    plz TEXT,
    einwohner INTEGER DEFAULT 0,

    -- Vertrag
    rahmenvertrag_id UUID,
    rahmenvertrag_name TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ein Gebiet kann nur einmal pro Kampagne zugeordnet werden
    UNIQUE(campaign_id, customer_area_id)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_campaign_areas_campaign ON public.campaign_areas(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_areas_customer_area ON public.campaign_areas(customer_area_id);

COMMENT ON TABLE public.campaign_areas IS 'Einsatzgebiete pro Kampagne';


-- ================================================================
-- 3. CAMPAIGN_ASSIGNMENTS - Wöchentliche Zuweisungen
-- ================================================================
-- Teamchef und Werber pro Kampagne und KW

CREATE TABLE IF NOT EXISTS public.campaign_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    kw INTEGER NOT NULL CHECK (kw >= 1 AND kw <= 53),

    -- Teamchef (1 pro KW)
    teamchef_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Eine Zuweisung pro Kampagne und KW
    UNIQUE(campaign_id, kw)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_campaign ON public.campaign_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_kw ON public.campaign_assignments(kw);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_teamchef ON public.campaign_assignments(teamchef_id);

COMMENT ON TABLE public.campaign_assignments IS 'Wöchentliche Zuweisungen (Teamchef) pro Kampagne';


-- ================================================================
-- 4. CAMPAIGN_ASSIGNMENT_WERBER - Werber pro Woche
-- ================================================================
-- Mehrere Werber pro Assignment

CREATE TABLE IF NOT EXISTS public.campaign_assignment_werber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.campaign_assignments(id) ON DELETE CASCADE,
    werber_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ein Werber kann nur einmal pro Assignment zugeordnet werden
    UNIQUE(assignment_id, werber_id)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_campaign_assignment_werber_assignment ON public.campaign_assignment_werber(assignment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignment_werber_werber ON public.campaign_assignment_werber(werber_id);

COMMENT ON TABLE public.campaign_assignment_werber IS 'Werber-Zuweisungen pro Woche';


-- ================================================================
-- 5. CAMPAIGN_ATTENDANCE - Anwesenheit
-- ================================================================
-- Anwesenheit pro Person, KW und Tag

CREATE TABLE IF NOT EXISTS public.campaign_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kw INTEGER NOT NULL CHECK (kw >= 1 AND kw <= 53),

    -- Anwesenheit pro Wochentag (Mo=0, So=6)
    day_0 BOOLEAN DEFAULT true, -- Montag
    day_1 BOOLEAN DEFAULT true, -- Dienstag
    day_2 BOOLEAN DEFAULT true, -- Mittwoch
    day_3 BOOLEAN DEFAULT true, -- Donnerstag
    day_4 BOOLEAN DEFAULT true, -- Freitag
    day_5 BOOLEAN DEFAULT true, -- Samstag
    day_6 BOOLEAN DEFAULT true, -- Sonntag

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ein Eintrag pro Person, Kampagne und KW
    UNIQUE(campaign_id, user_id, kw)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_campaign_attendance_campaign ON public.campaign_attendance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_attendance_user ON public.campaign_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_attendance_kw ON public.campaign_attendance(kw);

COMMENT ON TABLE public.campaign_attendance IS 'Anwesenheit pro Person und Woche';


-- ================================================================
-- 6. CAMPAIGN_ATTENDANCE_NOTES - Notizen zur Anwesenheit
-- ================================================================

CREATE TABLE IF NOT EXISTS public.campaign_attendance_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES public.campaign_attendance(id) ON DELETE CASCADE,

    -- Notiz
    note_text TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_campaign_attendance_notes_attendance ON public.campaign_attendance_notes(attendance_id);

COMMENT ON TABLE public.campaign_attendance_notes IS 'Notizen zur Anwesenheit';


-- ================================================================
-- TRIGGER: Auto-Update Timestamps
-- ================================================================

-- Trigger für neue Tabellen (falls update_updated_at_column existiert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- campaign_areas
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_areas_updated_at') THEN
            CREATE TRIGGER update_campaign_areas_updated_at
                BEFORE UPDATE ON public.campaign_areas
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- campaign_assignments
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_assignments_updated_at') THEN
            CREATE TRIGGER update_campaign_assignments_updated_at
                BEFORE UPDATE ON public.campaign_assignments
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- campaign_attendance
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_attendance_updated_at') THEN
            CREATE TRIGGER update_campaign_attendance_updated_at
                BEFORE UPDATE ON public.campaign_attendance
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;


-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.campaign_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignment_werber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_attendance_notes ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- RLS POLICIES - CAMPAIGN_AREAS
-- ================================================================

CREATE POLICY "Authenticated users can view campaign_areas"
    ON public.campaign_areas FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage campaign_areas"
    ON public.campaign_areas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ================================================================
-- RLS POLICIES - CAMPAIGN_ASSIGNMENTS
-- ================================================================

CREATE POLICY "Authenticated users can view campaign_assignments"
    ON public.campaign_assignments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage campaign_assignments"
    ON public.campaign_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ================================================================
-- RLS POLICIES - CAMPAIGN_ASSIGNMENT_WERBER
-- ================================================================

CREATE POLICY "Authenticated users can view campaign_assignment_werber"
    ON public.campaign_assignment_werber FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage campaign_assignment_werber"
    ON public.campaign_assignment_werber FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ================================================================
-- RLS POLICIES - CAMPAIGN_ATTENDANCE
-- ================================================================

CREATE POLICY "Users can view own attendance"
    ON public.campaign_attendance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
    ON public.campaign_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage attendance"
    ON public.campaign_attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ================================================================
-- RLS POLICIES - CAMPAIGN_ATTENDANCE_NOTES
-- ================================================================

CREATE POLICY "Authenticated users can view attendance_notes"
    ON public.campaign_attendance_notes FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage attendance_notes"
    ON public.campaign_attendance_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ================================================================
-- FERTIG!
-- ================================================================
--
-- Neue Tabellen:
-- ✅ campaigns (erweitert um year, kw_from, kw_to, customer_id, etc.)
-- ✅ campaign_areas
-- ✅ campaign_assignments
-- ✅ campaign_assignment_werber
-- ✅ campaign_attendance
-- ✅ campaign_attendance_notes
--
-- Nächster Schritt: JavaScript-Code anpassen
-- ================================================================
