-- ================================================================
-- Migration 024: Ledger-Schema erweitern
-- Fügt campaign_id, campaign_area_id, customer_id/werber_id hinzu
-- ================================================================

-- provisions_ledger erweitern
ALTER TABLE provisions_ledger
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- customer_billing_ledger erweitern
ALTER TABLE customer_billing_ledger
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS werber_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_campaign ON provisions_ledger(campaign_id);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_area ON provisions_ledger(campaign_area_id);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_customer ON provisions_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_campaign ON customer_billing_ledger(campaign_id);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_area ON customer_billing_ledger(campaign_area_id);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_werber ON customer_billing_ledger(werber_id);

-- Kommentare
COMMENT ON COLUMN provisions_ledger.campaign_id IS 'Kampagne des Records';
COMMENT ON COLUMN provisions_ledger.campaign_area_id IS 'Einsatzgebiet des Records';
COMMENT ON COLUMN provisions_ledger.customer_id IS 'Kunde des Records';
COMMENT ON COLUMN customer_billing_ledger.campaign_id IS 'Kampagne des Records';
COMMENT ON COLUMN customer_billing_ledger.campaign_area_id IS 'Einsatzgebiet des Records';
COMMENT ON COLUMN customer_billing_ledger.werber_id IS 'Werber des Records';
