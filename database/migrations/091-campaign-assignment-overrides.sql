-- Tagesgenaue WG-Zuordnung: Overrides für vergangene Tage bei WG-Wechsel
CREATE TABLE public.campaign_assignment_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
    werber_id UUID NOT NULL REFERENCES public.users(id),
    kw INTEGER NOT NULL CHECK (kw >= 1 AND kw <= 53),
    day INTEGER NOT NULL CHECK (day >= 0 AND day <= 5),
    campaign_area_id UUID REFERENCES public.campaign_areas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, werber_id, kw, day)
);

-- RLS deaktivieren
ALTER TABLE public.campaign_assignment_overrides DISABLE ROW LEVEL SECURITY;
