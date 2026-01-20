-- Migration 058: Campaign Areas erweitern für DRK-Folgevergütung

ALTER TABLE campaign_areas
ADD COLUMN IF NOT EXISTS qualitaetsbonus_datum DATE,
ADD COLUMN IF NOT EXISTS einwohnerzahl INTEGER,
ADD COLUMN IF NOT EXISTS stornopuffer INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS endabr_wochen INTEGER DEFAULT 8;

COMMENT ON COLUMN campaign_areas.qualitaetsbonus_datum IS 'Festes Datum für QB-Berechnung, NULL = bei VJ2-Abrechnung';
COMMENT ON COLUMN campaign_areas.einwohnerzahl IS 'Für Sondierungslimit bei limitType=prozent';
COMMENT ON COLUMN campaign_areas.stornopuffer IS 'Stornopuffer in % (Standard: 10)';
COMMENT ON COLUMN campaign_areas.endabr_wochen IS 'Wochen nach letztem Einsatztag für Endabrechnung';
