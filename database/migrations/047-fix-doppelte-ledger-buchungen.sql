-- ============================================================================
-- Migration 047: Fix Doppelte Ledger-Buchungen
-- ============================================================================
-- Problem: Zwei INSERT-Trigger auf records erstellen redundante Buchungen
-- Lösung: Logik zusammenführen in einen Trigger
-- ============================================================================

-- ============================================================================
-- 1. ÜBERFLÜSSIGEN TRIGGER ENTFERNEN
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_record_recruitment_insert ON public.records;

-- ============================================================================
-- 2. HANDLE_RECORD_INSERT ERWEITERN (inkl. user_recruitments)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_einheiten DECIMAL(10,4);
    v_jahreseuros DECIMAL(10,2);
    v_recruitment RECORD;
BEGIN
    -- Nur bei aktiven Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- Betrag je nach Record-Typ bestimmen
    IF NEW.record_type = 'erhoehung' THEN
        v_jahreseuros := COALESCE(NEW.increase_amount, 0);
    ELSE
        v_jahreseuros := COALESCE(NEW.yearly_amount, 0);
    END IF;

    -- Einheiten berechnen (Jahreseuros / 12)
    v_einheiten := v_jahreseuros / 12;

    -- ========== WERBER-LEDGER ==========

    -- 1. Werben-Provision (werber_id)
    IF NEW.werber_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 2. Teamleitung-Provision (teamchef_id) - NUR wenn TC ≠ Werber
    IF NEW.teamchef_id IS NOT NULL AND NEW.teamchef_id IS DISTINCT FROM NEW.werber_id THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 3. Quality-Provision (quality_id) - NUR wenn Quality ≠ Werber
    IF NEW.quality_id IS NOT NULL AND NEW.quality_id IS DISTINCT FROM NEW.werber_id THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 4. Recruiting/Empfehlung über user_recruitments
    FOR v_recruitment IN
        SELECT recruited_by_id, recruitment_type
        FROM user_recruitments
        WHERE user_id = NEW.werber_id
    LOOP
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (v_recruitment.recruited_by_id, NEW.id, v_recruitment.recruitment_type, 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END LOOP;

    -- ========== KUNDEN-LEDGER ==========

    IF NEW.customer_id IS NOT NULL THEN
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
        VALUES (NEW.customer_id, NEW.id, 'provision', v_jahreseuros, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. DUPLIKATE BEREINIGEN
-- ============================================================================

-- Doppelte Einträge löschen (behalte den ältesten pro record_id/user_id/kategorie)
DELETE FROM provisions_ledger
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY record_id, user_id, kategorie
            ORDER BY created_at
        ) as rn
        FROM provisions_ledger
        WHERE typ = 'provision'
        AND record_id IS NOT NULL
    ) t WHERE rn > 1
);

-- ============================================================================
-- 4. VERIFIZIERUNG (als Kommentar für manuelle Prüfung)
-- ============================================================================

-- Keine Duplikate mehr:
-- SELECT record_id, user_id, kategorie, COUNT(*)
-- FROM provisions_ledger
-- WHERE typ = 'provision' AND record_id IS NOT NULL
-- GROUP BY record_id, user_id, kategorie
-- HAVING COUNT(*) > 1;

-- Nur 1 INSERT Trigger auf records:
-- SELECT trigger_name, event_manipulation
-- FROM information_schema.triggers
-- WHERE event_object_table = 'records' AND event_manipulation = 'INSERT';
