-- Migration 087: Kampagnenspezifische Kunden-Konfiguration
-- Verschiebt Provision/Kosten von customers auf Kampagnen-Ebene

-- ================================================================
-- 1. NEUE TABELLE: campaign_customer_config
-- ================================================================

CREATE TABLE IF NOT EXISTS campaign_customer_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Provisionen (wie campaign_areas)
    provision_sondierung JSONB DEFAULT NULL,
    provision_regular JSONB DEFAULT NULL,
    qualitaetsbonus JSONB DEFAULT NULL,
    qualitaetsbonus_datum DATE DEFAULT NULL,
    teilverguetung BOOLEAN DEFAULT false,
    teilv_prozent INTEGER DEFAULT NULL,
    stornopuffer INTEGER DEFAULT 15,
    endabr_wochen INTEGER DEFAULT 12,

    -- Kosten (wie campaign_areas)
    kosten JSONB DEFAULT NULL,
    sonderposten JSONB DEFAULT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Eindeutigkeit: Pro Kunde + Kampagne nur ein Eintrag
    UNIQUE(customer_id, campaign_id)
);

-- ================================================================
-- 2. INDEX für schnelle Abfragen
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_campaign_customer_config_customer
    ON campaign_customer_config(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_customer_config_campaign
    ON campaign_customer_config(campaign_id);

-- ================================================================
-- 3. TRIGGER für updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_campaign_customer_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_campaign_customer_config_updated_at ON campaign_customer_config;
CREATE TRIGGER trigger_campaign_customer_config_updated_at
    BEFORE UPDATE ON campaign_customer_config
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_customer_config_updated_at();

-- ================================================================
-- 4. RLS (Row Level Security)
-- ================================================================

ALTER TABLE campaign_customer_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON campaign_customer_config
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- 5. COMMENTS
-- ================================================================

COMMENT ON TABLE campaign_customer_config IS 'Kampagnenspezifische Kunden-Konfiguration für Provision und Kosten';
COMMENT ON COLUMN campaign_customer_config.provision_sondierung IS 'Kunden-Provision Sondierung für diese Kampagne';
COMMENT ON COLUMN campaign_customer_config.provision_regular IS 'Kunden-Provision Regular für diese Kampagne';
COMMENT ON COLUMN campaign_customer_config.kosten IS 'Kunden-Kosten für diese Kampagne (Fallback für WGs)';
