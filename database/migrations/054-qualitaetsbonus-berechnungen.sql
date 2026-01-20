-- Migration 054: Qualitätsbonus-Berechnungen
-- Tracking der Qualitätsbonus-Berechnungen pro Einsatzgebiet

CREATE TABLE IF NOT EXISTS qualitaetsbonus_berechnungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_area_id UUID NOT NULL REFERENCES campaign_areas(id) ON DELETE CASCADE,

    -- Berechnung
    berechnet_am DATE NOT NULL,
    gesamt_mg INTEGER NOT NULL,
    stornierte_mg INTEGER NOT NULL,
    stornoquote DECIMAL(5,2) NOT NULL,
    bonus_pp INTEGER NOT NULL,

    -- Anwendung
    angewendet_auf_records INTEGER,
    korrektur_summe DECIMAL(10,2),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: Eine Berechnung pro Einsatzgebiet
    UNIQUE(campaign_area_id)
);

-- Indizes
CREATE INDEX idx_qbonus_campaign ON qualitaetsbonus_berechnungen(campaign_id);
CREATE INDEX idx_qbonus_area ON qualitaetsbonus_berechnungen(campaign_area_id);

-- Kommentare
COMMENT ON TABLE qualitaetsbonus_berechnungen IS 'Speichert Qualitätsbonus-Berechnungen pro Einsatzgebiet (bei VJ2)';
COMMENT ON COLUMN qualitaetsbonus_berechnungen.stornoquote IS 'Stornoquote in %, z.B. 8.50 für 8,5%';
COMMENT ON COLUMN qualitaetsbonus_berechnungen.bonus_pp IS 'Ermittelter Bonus in Prozentpunkten';
COMMENT ON COLUMN qualitaetsbonus_berechnungen.korrektur_summe IS 'Gesamte rückwirkende Korrektur für VJ1';

-- RLS wird am Ende des Projekts aktiviert
