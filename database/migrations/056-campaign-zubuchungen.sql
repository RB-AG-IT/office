-- Migration 056: Campaign Zubuchungen (KFZ, Kleidung, Ausweise etc.)

CREATE TABLE IF NOT EXISTS campaign_zubuchungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE CASCADE,
    typ TEXT NOT NULL CHECK (typ IN ('kfz', 'kleidung', 'ausweise', 'sonstiges')),
    bezeichnung TEXT,
    betrag DECIMAL(10,2) NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    abgerechnet_am DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zubuchungen_campaign ON campaign_zubuchungen(campaign_id);
CREATE INDEX idx_zubuchungen_area ON campaign_zubuchungen(campaign_area_id);
CREATE INDEX idx_zubuchungen_invoice ON campaign_zubuchungen(invoice_id);

-- RLS wird am Ende des Projekts aktiviert
