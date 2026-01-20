-- Migration 053: Record Entitlements (Ansprüche pro Record × Vergütungsjahr)
-- Speichert die 5-Jahres-Vergütungsansprüche für DRK-Kunden

CREATE TABLE IF NOT EXISTS record_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    campaign_area_id UUID REFERENCES campaign_areas(id) ON DELETE SET NULL,

    -- Vergütungsjahr (1-5)
    verguetungsjahr INTEGER NOT NULL CHECK (verguetungsjahr BETWEEN 1 AND 5),

    -- Beträge
    jahreseuros DECIMAL(10,2) NOT NULL,

    -- Provisionssatz (wird bei ABRECHNUNG gesetzt, nicht bei Erstellung!)
    ist_sondierung BOOLEAN,
    basis_satz INTEGER,

    -- Qualitätsbonus (wird bei VJ2 gesetzt)
    qualitaetsbonus_pp INTEGER DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'ausstehend' CHECK (status IN (
        'ausstehend',
        'faellig',
        'abgerechnet',
        'storniert',
        'teilverguetet'
    )),

    -- Zeitliche Steuerung
    faellig_ab DATE,
    absicherung_ab DATE,
    ist_abgesichert BOOLEAN DEFAULT false,

    -- Abrechnung
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    abgerechnet_am DATE,
    abgerechneter_betrag DECIMAL(10,2),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: Ein Anspruch pro Record + VJ
    UNIQUE(record_id, verguetungsjahr)
);

-- Indizes
CREATE INDEX idx_entitlements_record ON record_entitlements(record_id);
CREATE INDEX idx_entitlements_customer ON record_entitlements(customer_id);
CREATE INDEX idx_entitlements_campaign_area ON record_entitlements(campaign_area_id);
CREATE INDEX idx_entitlements_status ON record_entitlements(status);
CREATE INDEX idx_entitlements_vj ON record_entitlements(verguetungsjahr);
CREATE INDEX idx_entitlements_faellig ON record_entitlements(faellig_ab);
CREATE INDEX idx_entitlements_invoice ON record_entitlements(invoice_id);

-- Kommentare
COMMENT ON TABLE record_entitlements IS 'Vergütungsansprüche pro Record für 5 Jahre (DRK-Folgevergütung)';
COMMENT ON COLUMN record_entitlements.ist_sondierung IS 'NULL bis Abrechnung, dann true/false';
COMMENT ON COLUMN record_entitlements.basis_satz IS 'Provisionssatz in %, wird bei Abrechnung gesetzt';
COMMENT ON COLUMN record_entitlements.qualitaetsbonus_pp IS 'Qualitätsbonus in Prozentpunkten, wird bei VJ2 gesetzt';

-- RLS wird am Ende des Projekts aktiviert
