-- Migration 086: Kunden-Ebene für Provision + Kosten
-- Erweitert customers mit den gleichen Provisions-/Kostenfeldern wie campaign_areas
-- Fügt individuelle_provision/kosten Toggles zu campaign_areas hinzu

-- ================================================================
-- 1. CUSTOMERS erweitern - Provisionen (analog zu campaign_areas)
-- ================================================================

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS provision_sondierung JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS provision_regular JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS qualitaetsbonus JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS qualitaetsbonus_datum DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS teilverguetung BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS teilv_prozent INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stornopuffer INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS endabr_wochen INTEGER DEFAULT 12;

-- ================================================================
-- 2. CUSTOMERS erweitern - Kosten (analog zu campaign_areas)
-- ================================================================

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS kosten JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sonderposten JSONB DEFAULT NULL;

-- ================================================================
-- 3. CAMPAIGN_AREAS erweitern - Individuelle Toggles
-- ================================================================

ALTER TABLE campaign_areas
ADD COLUMN IF NOT EXISTS individuelle_provision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS individuelle_kosten BOOLEAN DEFAULT false;

-- ================================================================
-- 4. COMMENTS
-- ================================================================

COMMENT ON COLUMN customers.provision_sondierung IS 'Kunden-Provision für Sondierung (Fallback für WGs)';
COMMENT ON COLUMN customers.provision_regular IS 'Kunden-Provision Regular (Fallback für WGs)';
COMMENT ON COLUMN customers.qualitaetsbonus IS 'Kunden-Qualitätsbonus-Regeln (Fallback für WGs)';
COMMENT ON COLUMN customers.qualitaetsbonus_datum IS 'Festes Datum für QB-Berechnung';
COMMENT ON COLUMN customers.teilverguetung IS 'Teilvergütung aktiv für Kunde';
COMMENT ON COLUMN customers.teilv_prozent IS 'Teilvergütungs-Prozentsatz';
COMMENT ON COLUMN customers.stornopuffer IS 'Stornopuffer in % (Standard: 15)';
COMMENT ON COLUMN customers.endabr_wochen IS 'Wochen nach letztem Einsatztag für Endabrechnung';
COMMENT ON COLUMN customers.kosten IS 'Kunden-Kosten inkl. Verteilung (Fallback für WGs)';
COMMENT ON COLUMN customers.sonderposten IS 'Kunden-Sonderposten (Fallback für WGs)';

COMMENT ON COLUMN campaign_areas.individuelle_provision IS 'true = WG-eigene Provision, false = Kunden-Provision';
COMMENT ON COLUMN campaign_areas.individuelle_kosten IS 'true = WG-eigene Kosten, false = Kunden-Kosten';
