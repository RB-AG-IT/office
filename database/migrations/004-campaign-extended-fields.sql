-- ================================================================
-- MIGRATION 004: Kampagnen erweiterte Felder
-- ================================================================
-- Fügt fehlende Felder hinzu für:
-- - Quality Manager in Assignments
-- - Challenges pro KW
-- - Werbegebiete-Konfiguration (Provisionen, Kosten)
-- ================================================================

-- ================================================================
-- 1. QUALITY MANAGER in campaign_assignments
-- ================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_assignments' AND column_name = 'quality_manager_id') THEN
        ALTER TABLE public.campaign_assignments
        ADD COLUMN quality_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_assignments_qm ON public.campaign_assignments(quality_manager_id);


-- ================================================================
-- 2. CAMPAIGN_CHALLENGES - Challenges pro KW
-- ================================================================

CREATE TABLE IF NOT EXISTS public.campaign_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    kw INTEGER NOT NULL CHECK (kw >= 1 AND kw <= 53),

    -- Challenge-Daten
    challenge_type TEXT NOT NULL, -- 'neumitglieder', 'erhoehungen', etc.
    ziel INTEGER NOT NULL DEFAULT 0,
    belohnung INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_campaign_challenges_campaign ON public.campaign_challenges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_challenges_kw ON public.campaign_challenges(kw);

COMMENT ON TABLE public.campaign_challenges IS 'Challenges pro Kampagne und KW';

-- Trigger für updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_challenges_updated_at') THEN
            CREATE TRIGGER update_campaign_challenges_updated_at
                BEFORE UPDATE ON public.campaign_challenges
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- RLS
ALTER TABLE public.campaign_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaign_challenges"
    ON public.campaign_challenges FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage campaign_challenges"
    ON public.campaign_challenges FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ================================================================
-- 3. CAMPAIGN_AREAS erweitern - Provisionen & Kosten
-- ================================================================

DO $$
BEGIN
    -- Provisionen Sondierung (JSONB für j1-j5, limit, limitType)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'provision_sondierung') THEN
        ALTER TABLE public.campaign_areas
        ADD COLUMN provision_sondierung JSONB DEFAULT '{"j1": 80, "j2": 50, "j3": 30, "j4": 0, "j5": 0, "limit": 100, "limitType": "mg"}';
    END IF;

    -- Provisionen Regular (JSONB für j1-j5)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'provision_regular') THEN
        ALTER TABLE public.campaign_areas
        ADD COLUMN provision_regular JSONB DEFAULT '{"j1": 60, "j2": 40, "j3": 20, "j4": 0, "j5": 0}';
    END IF;

    -- Qualitätsbonus (JSONB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'qualitaetsbonus') THEN
        ALTER TABLE public.campaign_areas
        ADD COLUMN qualitaetsbonus JSONB DEFAULT '{"aktiv": true, "regeln": []}';
    END IF;

    -- Teilvergütung
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'teilverguetung') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN teilverguetung BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'teilv_prozent') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN teilv_prozent INTEGER DEFAULT 50;
    END IF;

    -- Stornopuffer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'stornopuffer') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN stornopuffer INTEGER DEFAULT 10;
    END IF;

    -- Endabrechnung Wochen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'endabr_wochen') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN endabr_wochen INTEGER DEFAULT 8;
    END IF;

    -- Kosten (JSONB für kfz, kleidung, ausweise)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'kosten') THEN
        ALTER TABLE public.campaign_areas
        ADD COLUMN kosten JSONB DEFAULT '{}';
    END IF;

    -- Sonderposten (JSONB Array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'sonderposten') THEN
        ALTER TABLE public.campaign_areas
        ADD COLUMN sonderposten JSONB DEFAULT '[]';
    END IF;

    -- Aktive KWs (Array von Integers)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'active_kws') THEN
        ALTER TABLE public.campaign_areas
        ADD COLUMN active_kws INTEGER[] DEFAULT '{}';
    END IF;

    -- AVV Dokument URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'avv_url') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN avv_url TEXT;
    END IF;

    -- Gruppenbild URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'campaign_areas' AND column_name = 'gruppenbild_url') THEN
        ALTER TABLE public.campaign_areas ADD COLUMN gruppenbild_url TEXT;
    END IF;

END $$;


-- ================================================================
-- FERTIG!
-- ================================================================
