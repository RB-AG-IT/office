-- ============================================================================
-- Migration 025: Ledger-Trigger aktualisieren
-- Fügt campaign_id, campaign_area_id, customer_id/werber_id zu allen INSERTs hinzu
-- ============================================================================

-- ============================================================================
-- 1. TRIGGER: Record INSERT (aktualisiert)
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
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 2. Teamleitung-Provision (teamchef_id)
    IF NEW.teamchef_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 3. Quality-Provision (quality_id)
    IF NEW.quality_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 4. Empfehlungs-Provision (empfehlung_id)
    IF NEW.empfehlung_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- 5. Recruiting-Provision (recruiting_id)
    IF NEW.recruiting_id IS NOT NULL THEN
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END IF;

    -- ========== KUNDEN-LEDGER ==========

    IF NEW.customer_id IS NOT NULL THEN
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
        VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TRIGGER: Record UPDATE (aktualisiert)
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
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), OLD.kw, OLD.year, OLD.start_date, 'Record storniert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
        FROM provisions_ledger
        WHERE record_id = NEW.id
        GROUP BY user_id, record_id, kategorie;

        -- Kunden-Ledger: Gegenbuchung
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
        SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), OLD.kw, OLD.year, OLD.start_date, 'Record storniert', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id
        FROM customer_billing_ledger
        WHERE record_id = NEW.id
        GROUP BY customer_id, record_id;

        RETURN NEW;
    END IF;

    -- ========== REAKTIVIERUNG (record_status storno → aktiv) ==========

    IF OLD.record_status = 'storno' AND NEW.record_status = 'aktiv' THEN
        -- Werber-Ledger: Neue Buchungen für alle Kategorien
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        IF NEW.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        IF NEW.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        IF NEW.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        IF NEW.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        -- Kunden-Ledger: Neue Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
            VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
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
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        SELECT user_id, NEW.id, kategorie, 'korrektur', v_diff_einheiten, NEW.kw, NEW.year, NEW.start_date,
               'Betrag geändert: ' || COALESCE(OLD.yearly_amount, 0) || ' → ' || COALESCE(NEW.yearly_amount, 0),
               NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
        FROM provisions_ledger
        WHERE record_id = NEW.id
        GROUP BY user_id, kategorie;

        -- Kunden-Ledger: Korrektur-Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
            VALUES (NEW.customer_id, NEW.id, 'korrektur', v_diff_jahreseuros, NEW.kw, NEW.year, NEW.start_date,
                   'Betrag geändert: ' || COALESCE(OLD.yearly_amount, 0) || ' → ' || COALESCE(NEW.yearly_amount, 0),
                   NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
        END IF;
    END IF;

    -- ========== WERBER-ÄNDERUNG (werber_id) ==========

    IF OLD.werber_id IS DISTINCT FROM NEW.werber_id THEN
        -- Alter Werber: Storno
        IF OLD.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Werber geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'werben' AND user_id = OLD.werber_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        -- Neuer Werber: Buchung
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Werber zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;
    END IF;

    -- ========== TEAMCHEF-ÄNDERUNG (teamchef_id) ==========

    IF OLD.teamchef_id IS DISTINCT FROM NEW.teamchef_id THEN
        IF OLD.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Teamchef geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'teamleitung' AND user_id = OLD.teamchef_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        IF NEW.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Teamchef zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;
    END IF;

    -- ========== QUALITY-ÄNDERUNG (quality_id) ==========

    IF OLD.quality_id IS DISTINCT FROM NEW.quality_id THEN
        IF OLD.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Quality geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'quality' AND user_id = OLD.quality_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        IF NEW.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Quality zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;
    END IF;

    -- ========== EMPFEHLUNG-ÄNDERUNG (empfehlung_id) ==========

    IF OLD.empfehlung_id IS DISTINCT FROM NEW.empfehlung_id THEN
        IF OLD.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Empfehlung geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'empfehlung' AND user_id = OLD.empfehlung_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        IF NEW.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.empfehlung_id, NEW.id, 'empfehlung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Empfehlung zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;
    END IF;

    -- ========== RECRUITING-ÄNDERUNG (recruiting_id) ==========

    IF OLD.recruiting_id IS DISTINCT FROM NEW.recruiting_id THEN
        IF OLD.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Recruiting geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
            FROM provisions_ledger
            WHERE record_id = NEW.id AND kategorie = 'recruiting' AND user_id = OLD.recruiting_id
            GROUP BY user_id, record_id, kategorie;
        END IF;

        IF NEW.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.recruiting_id, NEW.id, 'recruiting', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Recruiting zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;
    END IF;

    -- ========== KUNDEN-ÄNDERUNG (customer_id) ==========

    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
        IF OLD.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
            SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), NEW.kw, NEW.year, NEW.start_date, 'Kunde geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id
            FROM customer_billing_ledger
            WHERE record_id = NEW.id AND customer_id = OLD.customer_id
            GROUP BY customer_id, record_id;
        END IF;

        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
            VALUES (NEW.customer_id, NEW.id, 'provision', COALESCE(NEW.yearly_amount, 0), NEW.kw, NEW.year, NEW.start_date, 'Kunde zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TRIGGER: Record DELETE (aktualisiert)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Werber-Ledger: Gegenbuchung für alle Kategorien
    INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
    SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), OLD.kw, OLD.year, OLD.start_date, 'Record gelöscht', OLD.campaign_id, OLD.campaign_area_id, OLD.customer_id
    FROM provisions_ledger
    WHERE record_id = OLD.id
    GROUP BY user_id, record_id, kategorie;

    -- Kunden-Ledger: Gegenbuchung
    INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
    SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), OLD.kw, OLD.year, OLD.start_date, 'Record gelöscht', OLD.campaign_id, OLD.campaign_area_id, OLD.werber_id
    FROM customer_billing_ledger
    WHERE record_id = OLD.id
    GROUP BY customer_id, record_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HINWEIS: Trigger werden automatisch aktualisiert (CREATE OR REPLACE)
-- ============================================================================
