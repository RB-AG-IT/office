-- ============================================================================
-- Migration 022: Ledger-Trigger erstellen
-- ============================================================================
-- Automatische Buchungen bei Record-Änderungen:
-- - INSERT: Neue Buchungen für alle zugewiesenen Kategorien
-- - UPDATE: Storno, Betragsänderung, Zuweisungsänderungen
-- - DELETE: Gegenbuchungen
-- ============================================================================

-- ============================================================================
-- 1. TRIGGER: Record INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_einheiten DECIMAL(10,4);
BEGIN
    -- Nur bei aktiven Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- Einheiten berechnen (Jahreseuros / 12)
    v_einheiten := COALESCE(NEW.yearly_amount, 0) / 12;

    -- ========== WERBER-LEDGER ==========

    -- 1. Werben-Provision (werber_id)
    IF NEW.werber_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 2. Teamleitung-Provision (teamchef_id)
    IF NEW.teamchef_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 3. Quality-Provision (quality_id)
    IF NEW.quality_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 4. Empfehlungs-Provision (empfehlung_id)
    IF NEW.empfehlung_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- 5. Recruiting-Provision (recruiting_id)
    IF NEW.recruiting_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    -- ========== KUNDEN-LEDGER ==========

    IF NEW.customer_id IS NOT NULL THEN
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
        VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Record erstellt');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_insert ON public.records;
CREATE TRIGGER on_record_insert
    AFTER INSERT ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_insert();

-- ============================================================================
-- 2. TRIGGER: Record UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_update()
RETURNS TRIGGER AS $$
DECLARE
    v_old_einheiten DECIMAL(10,4);
    v_new_einheiten DECIMAL(10,4);
    v_diff_einheiten DECIMAL(10,4);
    v_diff_jahreseuros DECIMAL(10,2);
BEGIN
    v_old_einheiten := COALESCE(OLD.yearly_amount, 0) / 12;
    v_new_einheiten := COALESCE(NEW.yearly_amount, 0) / 12;
    v_diff_einheiten := v_new_einheiten - v_old_einheiten;
    v_diff_jahreseuros := COALESCE(NEW.yearly_amount, 0) - COALESCE(OLD.yearly_amount, 0);

    -- ========== STORNO (record_status → storno) ==========

    IF OLD.record_status = 'aktiv' AND NEW.record_status = 'storno' THEN
        -- Werber-Ledger: Gegenbuchung für alle Kategorien
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), OLD.kw, OLD.year, OLD.start_date, 'Record storniert'
        FROM provisions_ledger
        WHERE record_id = NEW.id
        GROUP BY user_id, record_id, kategorie;

        -- Kunden-Ledger: Gegenbuchung
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
        SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), OLD.kw, OLD.year, OLD.start_date, 'Record storniert'
        FROM customer_billing_ledger
        WHERE record_id = NEW.id
        GROUP BY customer_id, record_id;

        RETURN NEW;
    END IF;

    -- ========== REAKTIVIERUNG (record_status storno → aktiv) ==========

    IF OLD.record_status = 'storno' AND NEW.record_status = 'aktiv' THEN
        -- Werber-Ledger: Neue Buchungen für alle Kategorien
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        IF NEW.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        IF NEW.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        IF NEW.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        IF NEW.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        -- Kunden-Ledger: Neue Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert');
        END IF;

        RETURN NEW;
    END IF;

    -- Ab hier nur für aktive Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- ========== BETRAGS-ÄNDERUNG (yearly_amount) ==========

    IF OLD.yearly_amount IS DISTINCT FROM NEW.yearly_amount THEN
        -- Werber-Ledger: Korrektur-Buchung für alle bestehenden Kategorien
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
        SELECT user_id, NEW.id, kategorie, 'korrektur', v_diff_einheiten, NEW.kw, NEW.year, NEW.start_date,
               'Betrag geändert: ' || COALESCE(OLD.yearly_amount, 0) || ' → ' || COALESCE(NEW.yearly_amount, 0)
        FROM provisions_ledger
        WHERE record_id = NEW.id
        GROUP BY user_id, kategorie;

        -- Kunden-Ledger: Korrektur-Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.customer_id, NEW.id, 'korrektur', v_diff_jahreseuros, NEW.kw, NEW.year, NEW.start_date,
                   'Betrag geändert: ' || COALESCE(OLD.yearly_amount, 0) || ' → ' || COALESCE(NEW.yearly_amount, 0));
        END IF;
    END IF;

    -- ========== WERBER-ÄNDERUNG (werber_id) ==========

    IF OLD.werber_id IS DISTINCT FROM NEW.werber_id THEN
        -- Alter Werber: Storno
        IF OLD.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Werber geändert'
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'werben' AND user_id = OLD.werber_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neuer Werber: Buchung
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Werber zugewiesen');
        END IF;
    END IF;

    -- ========== TEAMCHEF-ÄNDERUNG (teamchef_id) ==========

    IF OLD.teamchef_id IS DISTINCT FROM NEW.teamchef_id THEN
        -- Alter TC: Storno
        IF OLD.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Teamchef geändert'
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'teamleitung' AND user_id = OLD.teamchef_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neuer TC: Buchung
        IF NEW.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Teamchef zugewiesen');
        END IF;
    END IF;

    -- ========== QUALITY-ÄNDERUNG (quality_id) ==========

    IF OLD.quality_id IS DISTINCT FROM NEW.quality_id THEN
        -- Alter Quality: Storno
        IF OLD.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Quality geändert'
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'quality' AND user_id = OLD.quality_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neuer Quality: Buchung
        IF NEW.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Quality zugewiesen');
        END IF;
    END IF;

    -- ========== EMPFEHLUNG-ÄNDERUNG (empfehlung_id) ==========

    IF OLD.empfehlung_id IS DISTINCT FROM NEW.empfehlung_id THEN
        -- Alte Empfehlung: Storno
        IF OLD.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Empfehlung geändert'
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'empfehlung' AND user_id = OLD.empfehlung_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neue Empfehlung: Buchung
        IF NEW.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Empfehlung zugewiesen');
        END IF;
    END IF;

    -- ========== RECRUITING-ÄNDERUNG (recruiting_id) ==========

    IF OLD.recruiting_id IS DISTINCT FROM NEW.recruiting_id THEN
        -- Altes Recruiting: Storno
        IF OLD.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Recruiting geändert'
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'recruiting' AND user_id = OLD.recruiting_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neues Recruiting: Buchung
        IF NEW.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Recruiting zugewiesen');
        END IF;
    END IF;

    -- ========== KUNDEN-ÄNDERUNG (customer_id) ==========

    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
        -- Alter Kunde: Storno
        IF OLD.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), NEW.kw, NEW.year, NEW.start_date, 'Kunde geändert'
            FROM customer_billing_ledger
            WHERE record_id = NEW.id AND customer_id = OLD.customer_id
            GROUP BY customer_id, record_id;
        END IF;

        -- Neuer Kunde: Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
            VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Kunde zugewiesen');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_update ON public.records;
CREATE TRIGGER on_record_update
    AFTER UPDATE ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_update();

-- ============================================================================
-- 3. TRIGGER: Record DELETE
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Werber-Ledger: Gegenbuchung für alle Kategorien
    INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
    SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), OLD.kw, OLD.year, OLD.start_date, 'Record gelöscht'
    FROM provisions_ledger
    WHERE record_id = OLD.id
    GROUP BY user_id, record_id, kategorie;

    -- Kunden-Ledger: Gegenbuchung
    INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
    SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), OLD.kw, OLD.year, OLD.start_date, 'Record gelöscht'
    FROM customer_billing_ledger
    WHERE record_id = OLD.id
    GROUP BY customer_id, record_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_delete ON public.records;
CREATE TRIGGER on_record_delete
    BEFORE DELETE ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_delete();

-- ============================================================================
-- HINWEIS: Führe Migration 023 aus, um Bestandsdaten zu migrieren.
-- ============================================================================
