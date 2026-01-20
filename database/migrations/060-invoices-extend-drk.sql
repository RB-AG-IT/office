-- Migration 060: Invoices erweitern für DRK-Kundenrechnungen

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS empfaenger_typ TEXT CHECK (empfaenger_typ IN ('OV', 'KV', 'LV')),
ADD COLUMN IF NOT EXISTS kunden_nr CHAR(3),
ADD COLUMN IF NOT EXISTS abrechnungstyp TEXT CHECK (abrechnungstyp IN ('ZA', 'EA', '1JA', '2JA', '3JA', '4JA')),
ADD COLUMN IF NOT EXISTS fortlaufende_nr INTEGER,
ADD COLUMN IF NOT EXISTS vertragsnummer TEXT,
ADD COLUMN IF NOT EXISTS ist_sondierung BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_campaign ON invoices(campaign_id);
CREATE INDEX IF NOT EXISTS idx_invoices_area ON invoices(campaign_area_id);
CREATE INDEX IF NOT EXISTS idx_invoices_abrtyp ON invoices(abrechnungstyp);
