-- Migration 085: DRK Cost Person Tracking Tabelle
-- Tracking für "einmalig + person" Kosten (welche Werber bereits gebucht wurden)

CREATE TABLE IF NOT EXISTS public.drk_cost_person_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
    campaign_area_id UUID NOT NULL REFERENCES public.campaign_areas(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    kostenart TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(customer_id, campaign_id, campaign_area_id, user_id, kostenart)
);

-- Indizes für Performance
CREATE INDEX idx_drk_cost_person_tracking_area ON drk_cost_person_tracking(campaign_area_id);
CREATE INDEX idx_drk_cost_person_tracking_user ON drk_cost_person_tracking(user_id);
CREATE INDEX idx_drk_cost_person_tracking_lookup ON drk_cost_person_tracking(customer_id, campaign_id, campaign_area_id, kostenart);

COMMENT ON TABLE drk_cost_person_tracking IS 'Tracking welche Werber bereits einmalige Kosten erhalten haben';
