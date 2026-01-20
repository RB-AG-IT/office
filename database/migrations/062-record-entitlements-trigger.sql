-- Migration 062: Record Entitlements Trigger (5 VJ-Ansprüche bei Record-Erstellung)

-- Funktion zur Berechnung des Absicherungsdatums
CREATE OR REPLACE FUNCTION calculate_absicherung_datum(
    p_start_date DATE,
    p_zahlungsart TEXT,
    p_vj INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
    v_monate INTEGER;
BEGIN
    -- Monate aus absicherungsfristen holen
    SELECT
        CASE p_vj
            WHEN 1 THEN monate_vj_1_2
            WHEN 2 THEN monate_vj_1_2
            WHEN 3 THEN monate_vj_3
            WHEN 4 THEN monate_vj_4
            WHEN 5 THEN monate_vj_5
        END
    INTO v_monate
    FROM absicherungsfristen
    WHERE zahlungsart = p_zahlungsart;

    -- Fallback auf monatlich wenn nicht gefunden
    IF v_monate IS NULL THEN
        v_monate := CASE p_vj
            WHEN 1 THEN 13
            WHEN 2 THEN 13
            WHEN 3 THEN 25
            WHEN 4 THEN 37
            WHEN 5 THEN 49
        END;
    END IF;

    RETURN p_start_date + (v_monate || ' months')::INTERVAL;
END;
$$;

-- Funktion zur Erstellung der 5 VJ-Ansprüche
CREATE OR REPLACE FUNCTION create_record_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id UUID;
    v_campaign_id UUID;
    v_campaign_area_id UUID;
    v_jahreseuros DECIMAL(10,2);
    v_zahlungsart TEXT;
    v_start_date DATE;
    v_vj INTEGER;
BEGIN
    -- Nur für DRK-Kunden (customer_id gesetzt)
    IF NEW.customer_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_customer_id := NEW.customer_id;
    v_campaign_id := NEW.campaign_id;
    v_campaign_area_id := NEW.campaign_area_id;
    v_jahreseuros := COALESCE(NEW.yearly_amount, 0);
    v_zahlungsart := COALESCE(NEW.interval, 'Monatlich');
    v_start_date := COALESCE(NEW.start_date, NEW.created_at::DATE);

    -- 5 Ansprüche erstellen (VJ 1-5)
    FOR v_vj IN 1..5 LOOP
        INSERT INTO record_entitlements (
            record_id,
            customer_id,
            campaign_id,
            campaign_area_id,
            verguetungsjahr,
            jahreseuros,
            status,
            faellig_ab,
            absicherung_ab
        ) VALUES (
            NEW.id,
            v_customer_id,
            v_campaign_id,
            v_campaign_area_id,
            v_vj,
            v_jahreseuros,
            CASE WHEN v_vj = 1 THEN 'faellig' ELSE 'ausstehend' END,
            v_start_date + ((v_vj - 1) * 12 || ' months')::INTERVAL,
            calculate_absicherung_datum(v_start_date, v_zahlungsart, v_vj)
        );
    END LOOP;

    RETURN NEW;
END;
$$;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_create_record_entitlements ON records;
CREATE TRIGGER trigger_create_record_entitlements
    AFTER INSERT ON records
    FOR EACH ROW
    EXECUTE FUNCTION create_record_entitlements();
