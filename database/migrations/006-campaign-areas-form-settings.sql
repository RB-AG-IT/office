-- Migration: Formular-Einstellungen für campaign_areas
-- Felder für Erhöhungen und Zahlungsmodalitäten pro Einsatzgebiet/Kampagne

DO $$
BEGIN
    -- Erhöhungen erlaubt (Boolean)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'erhohungen_enabled') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN erhohungen_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Erlaubte Zahlungsmodalitäten (Array)
    -- monthly, quarterly, biannual, annual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'payment_modalities') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN payment_modalities TEXT[] DEFAULT ARRAY['monthly', 'quarterly', 'biannual', 'annual'];
    END IF;
END $$;

-- Kommentare
COMMENT ON COLUMN public.campaign_areas.erhohungen_enabled IS 'Ob Erhöhungen (ERH) im Formular erlaubt sind';
COMMENT ON COLUMN public.campaign_areas.payment_modalities IS 'Erlaubte Zahlungsmodalitäten: monthly, quarterly, biannual, annual';
