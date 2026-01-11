-- KAMPAGNEN ERWEITERUNG - Office Backoffice

-- 1. CAMPAIGNS TABELLE ERWEITERN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'year') THEN
        ALTER TABLE public.campaigns ADD COLUMN year INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'kw_from') THEN
        ALTER TABLE public.campaigns ADD COLUMN kw_from INTEGER CHECK (kw_from >= 1 AND kw_from <= 53);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'kw_to') THEN
        ALTER TABLE public.campaigns ADD COLUMN kw_to INTEGER CHECK (kw_to >= 1 AND kw_to <= 53);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'customer_id') THEN
        ALTER TABLE public.campaigns ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'puffer_percent') THEN
        ALTER TABLE public.campaigns ADD COLUMN puffer_percent INTEGER DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'wartezeit_wochen') THEN
        ALTER TABLE public.campaigns ADD COLUMN wartezeit_wochen INTEGER DEFAULT 4;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_year ON public.campaigns(year);
CREATE INDEX IF NOT EXISTS idx_campaigns_customer ON public.campaigns(customer_id);

-- 2. CAMPAIGN_AREAS
CREATE TABLE IF NOT EXISTS public.campaign_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    customer_area_id UUID REFERENCES public.customer_areas(id) ON DELETE SET NULL,
    name TEXT,
    plz TEXT,
    einwohner INTEGER DEFAULT 0,
    rahmenvertrag_id UUID,
    rahmenvertrag_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, customer_area_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_areas_campaign ON public.campaign_areas(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_areas_customer_area ON public.campaign_areas(customer_area_id);

-- 3. CAMPAIGN_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.campaign_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    kw INTEGER NOT NULL CHECK (kw >= 1 AND kw <= 53),
    teamchef_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, kw)
);

CREATE INDEX IF NOT EXISTS idx_campaign_assignments_campaign ON public.campaign_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_kw ON public.campaign_assignments(kw);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_teamchef ON public.campaign_assignments(teamchef_id);

-- 4. CAMPAIGN_ASSIGNMENT_WERBER
CREATE TABLE IF NOT EXISTS public.campaign_assignment_werber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.campaign_assignments(id) ON DELETE CASCADE,
    werber_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, werber_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_assignment_werber_assignment ON public.campaign_assignment_werber(assignment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignment_werber_werber ON public.campaign_assignment_werber(werber_id);

-- 5. CAMPAIGN_ATTENDANCE
CREATE TABLE IF NOT EXISTS public.campaign_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kw INTEGER NOT NULL CHECK (kw >= 1 AND kw <= 53),
    day_0 BOOLEAN DEFAULT true,
    day_1 BOOLEAN DEFAULT true,
    day_2 BOOLEAN DEFAULT true,
    day_3 BOOLEAN DEFAULT true,
    day_4 BOOLEAN DEFAULT true,
    day_5 BOOLEAN DEFAULT true,
    day_6 BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, user_id, kw)
);

CREATE INDEX IF NOT EXISTS idx_campaign_attendance_campaign ON public.campaign_attendance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_attendance_user ON public.campaign_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_attendance_kw ON public.campaign_attendance(kw);

-- 6. CAMPAIGN_ATTENDANCE_NOTES
CREATE TABLE IF NOT EXISTS public.campaign_attendance_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES public.campaign_attendance(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_attendance_notes_attendance ON public.campaign_attendance_notes(attendance_id);

-- TRIGGER
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_areas_updated_at') THEN
            CREATE TRIGGER update_campaign_areas_updated_at BEFORE UPDATE ON public.campaign_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_assignments_updated_at') THEN
            CREATE TRIGGER update_campaign_assignments_updated_at BEFORE UPDATE ON public.campaign_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_attendance_updated_at') THEN
            CREATE TRIGGER update_campaign_attendance_updated_at BEFORE UPDATE ON public.campaign_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- RLS
ALTER TABLE public.campaign_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignment_werber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_attendance_notes ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Authenticated users can view campaign_areas" ON public.campaign_areas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage campaign_areas" ON public.campaign_areas FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can view campaign_assignments" ON public.campaign_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage campaign_assignments" ON public.campaign_assignments FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can view campaign_assignment_werber" ON public.campaign_assignment_werber FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage campaign_assignment_werber" ON public.campaign_assignment_werber FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own attendance" ON public.campaign_attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attendance" ON public.campaign_attendance FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage attendance" ON public.campaign_attendance FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can view attendance_notes" ON public.campaign_attendance_notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage attendance_notes" ON public.campaign_attendance_notes FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
