-- ============================================================================
-- Migration 028: Automatische Zuweisung von kw, year, teamchef_id, quality_id
-- ============================================================================
--
-- Problem: Records werden ohne kw, year, teamchef_id, quality_id erstellt
-- Lösung: BEFORE INSERT Trigger der diese Felder automatisch setzt
--
-- Erstellt: 11.01.2026
-- ============================================================================

-- 1. TRIGGER-FUNKTION: Automatische Zuweisung bei Record-Insert
CREATE OR REPLACE FUNCTION set_record_assignments()
RETURNS TRIGGER AS $$
DECLARE
    v_kw INTEGER;
    v_year INTEGER;
    v_teamchef_id UUID;
    v_quality_id UUID;
BEGIN
    -- ========== KW und YEAR aus start_date berechnen ==========

    IF NEW.start_date IS NOT NULL THEN
        -- Jahr direkt aus start_date
        v_year := EXTRACT(YEAR FROM NEW.start_date);

        -- ISO Kalenderwoche berechnen
        v_kw := EXTRACT(WEEK FROM NEW.start_date);

        -- Nur setzen wenn nicht bereits vorhanden
        IF NEW.year IS NULL THEN
            NEW.year := v_year;
        END IF;

        IF NEW.kw IS NULL THEN
            NEW.kw := v_kw;
        END IF;
    END IF;

    -- ========== Teamchef und Quality aus campaign_assignments ==========

    -- Nur wenn campaign_id vorhanden und kw bekannt
    IF NEW.campaign_id IS NOT NULL AND NEW.kw IS NOT NULL THEN
        -- Teamchef und Quality Manager für diese Kampagne + KW laden
        SELECT ca.teamchef_id, ca.quality_manager_id
        INTO v_teamchef_id, v_quality_id
        FROM campaign_assignments ca
        WHERE ca.campaign_id = NEW.campaign_id
          AND ca.kw = NEW.kw
        LIMIT 1;

        -- Nur setzen wenn nicht bereits vorhanden
        IF NEW.teamchef_id IS NULL AND v_teamchef_id IS NOT NULL THEN
            NEW.teamchef_id := v_teamchef_id;
        END IF;

        IF NEW.quality_id IS NULL AND v_quality_id IS NOT NULL THEN
            NEW.quality_id := v_quality_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TRIGGER erstellen (BEFORE INSERT)
DROP TRIGGER IF EXISTS on_record_set_assignments ON public.records;
CREATE TRIGGER on_record_set_assignments
    BEFORE INSERT ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION set_record_assignments();

-- ============================================================================
-- 3. BESTANDSDATEN: kw und year aus start_date nachträglich setzen
-- ============================================================================

UPDATE records
SET
    kw = EXTRACT(WEEK FROM start_date),
    year = EXTRACT(YEAR FROM start_date)
WHERE start_date IS NOT NULL
  AND (kw IS NULL OR year IS NULL);

-- ============================================================================
-- 4. BESTANDSDATEN: teamchef_id und quality_id aus campaign_assignments setzen
-- ============================================================================

UPDATE records r
SET
    teamchef_id = ca.teamchef_id,
    quality_id = ca.quality_manager_id
FROM campaign_assignments ca
WHERE r.campaign_id = ca.campaign_id
  AND r.kw = ca.kw
  AND (r.teamchef_id IS NULL OR r.quality_id IS NULL)
  AND (ca.teamchef_id IS NOT NULL OR ca.quality_manager_id IS NOT NULL);

-- ============================================================================
-- 5. FEHLENDE LEDGER-EINTRÄGE für teamleitung erstellen
-- ============================================================================

INSERT INTO provisions_ledger (
    user_id, record_id, kategorie, typ, einheiten,
    kw, year, referenz_datum, beschreibung,
    campaign_id, campaign_area_id, customer_id
)
SELECT
    r.teamchef_id,
    r.id,
    'teamleitung',
    'provision',
    CASE
        WHEN r.record_type = 'erhoehung' THEN COALESCE(r.increase_amount, 0) / 12
        ELSE COALESCE(r.yearly_amount, 0) / 12
    END,
    r.kw,
    r.year,
    COALESCE(r.start_date, r.created_at::date),
    'Migration 028: TC-Zuordnung',
    r.campaign_id,
    r.campaign_area_id,
    r.customer_id
FROM records r
WHERE r.record_status = 'aktiv'
  AND r.teamchef_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM provisions_ledger pl
      WHERE pl.record_id = r.id
        AND pl.kategorie = 'teamleitung'
  );

-- ============================================================================
-- 6. FEHLENDE LEDGER-EINTRÄGE für quality erstellen
-- ============================================================================

INSERT INTO provisions_ledger (
    user_id, record_id, kategorie, typ, einheiten,
    kw, year, referenz_datum, beschreibung,
    campaign_id, campaign_area_id, customer_id
)
SELECT
    r.quality_id,
    r.id,
    'quality',
    'provision',
    CASE
        WHEN r.record_type = 'erhoehung' THEN COALESCE(r.increase_amount, 0) / 12
        ELSE COALESCE(r.yearly_amount, 0) / 12
    END,
    r.kw,
    r.year,
    COALESCE(r.start_date, r.created_at::date),
    'Migration 028: Quality-Zuordnung',
    r.campaign_id,
    r.campaign_area_id,
    r.customer_id
FROM records r
WHERE r.record_status = 'aktiv'
  AND r.quality_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM provisions_ledger pl
      WHERE pl.record_id = r.id
        AND pl.kategorie = 'quality'
  );

-- ============================================================================
-- DONE
-- ============================================================================
