-- Migration 012: Werber-Einsatzgebiet-Zuordnung
-- Speichert welches Einsatzgebiet ein Werber in einer KW hat (für Formular-Zuordnung)

-- Spalte campaign_area_id zu campaign_assignment_werber hinzufügen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_assignment_werber' AND column_name = 'campaign_area_id') THEN
        ALTER TABLE public.campaign_assignment_werber
        ADD COLUMN campaign_area_id UUID REFERENCES public.campaign_areas(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_campaign_assignment_werber_area
ON public.campaign_assignment_werber(campaign_area_id);

COMMENT ON COLUMN public.campaign_assignment_werber.campaign_area_id IS 'Einsatzgebiet des Werbers in dieser KW (bestimmt Formular)';
