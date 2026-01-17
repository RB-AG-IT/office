-- ============================================================================
-- Migration 035: Recruiting/Empfehlung über user_recruitments
-- ============================================================================
--
-- VORHER: records.recruiting_id / records.empfehlung_id → Ledger
-- NACHHER: user_recruitments → Ledger (für ALLE Records des Werbers)
--
-- Wenn im Profil eingetragen wird "Maya wurde von Burak rekrutiert":
-- → Alle Records von Maya bekommen Recruiting-Buchung für Burak
--
-- ============================================================================

-- ============================================================================
-- 1. TRIGGER-FUNKTION: user_recruitments → provisions_ledger
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_user_recruitment_change()
RETURNS TRIGGER AS $$
DECLARE
    v_record RECORD;
    v_einheiten DECIMAL(10,4);
    v_jahreseuros DECIMAL(10,2);
BEGIN
    -- ========== DELETE: Alle Buchungen stornieren ==========
    IF TG_OP = 'DELETE' THEN
        -- Für jeden Record des Werbers eine Storno-Buchung
        FOR v_record IN
            SELECT r.id, r.record_type, r.yearly_amount, r.increase_amount,
                   r.kw, r.year, r.start_date, r.campaign_id, r.campaign_area_id, r.customer_id
            FROM records r
            WHERE r.werber_id = OLD.user_id
            AND r.record_status = 'aktiv'
        LOOP
            -- Einheiten berechnen
            IF v_record.record_type = 'erhoehung' THEN
                v_jahreseuros := COALESCE(v_record.increase_amount, 0);
            ELSE
                v_jahreseuros := COALESCE(v_record.yearly_amount, 0);
            END IF;
            v_einheiten := v_jahreseuros / 12;

            -- Storno-Buchung für alte Person
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (OLD.recruited_by_id, v_record.id, OLD.recruitment_type, 'storno', -v_einheiten, v_record.kw, v_record.year, v_record.start_date,
                    CASE OLD.recruitment_type WHEN 'recruiting' THEN 'Recruiting entfernt' ELSE 'Empfehlung entfernt' END,
                    v_record.campaign_id, v_record.campaign_area_id, v_record.customer_id);
        END LOOP;

        RETURN OLD;
    END IF;

    -- ========== INSERT: Buchungen für alle Records erstellen ==========
    IF TG_OP = 'INSERT' THEN
        FOR v_record IN
            SELECT r.id, r.record_type, r.yearly_amount, r.increase_amount,
                   r.kw, r.year, r.start_date, r.campaign_id, r.campaign_area_id, r.customer_id
            FROM records r
            WHERE r.werber_id = NEW.user_id
            AND r.record_status = 'aktiv'
        LOOP
            IF v_record.record_type = 'erhoehung' THEN
                v_jahreseuros := COALESCE(v_record.increase_amount, 0);
            ELSE
                v_jahreseuros := COALESCE(v_record.yearly_amount, 0);
            END IF;
            v_einheiten := v_jahreseuros / 12;

            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.recruited_by_id, v_record.id, NEW.recruitment_type, 'provision', v_einheiten, v_record.kw, v_record.year, v_record.start_date,
                    CASE NEW.recruitment_type WHEN 'recruiting' THEN 'Recruiting zugewiesen' ELSE 'Empfehlung zugewiesen' END,
                    v_record.campaign_id, v_record.campaign_area_id, v_record.customer_id);
        END LOOP;

        RETURN NEW;
    END IF;

    -- ========== UPDATE: Storno alte Person, Buchung neue Person ==========
    IF TG_OP = 'UPDATE' THEN
        -- Nur wenn recruited_by_id sich geändert hat
        IF OLD.recruited_by_id IS DISTINCT FROM NEW.recruited_by_id THEN
            FOR v_record IN
                SELECT r.id, r.record_type, r.yearly_amount, r.increase_amount,
                       r.kw, r.year, r.start_date, r.campaign_id, r.campaign_area_id, r.customer_id
                FROM records r
                WHERE r.werber_id = NEW.user_id
                AND r.record_status = 'aktiv'
            LOOP
                IF v_record.record_type = 'erhoehung' THEN
                    v_jahreseuros := COALESCE(v_record.increase_amount, 0);
                ELSE
                    v_jahreseuros := COALESCE(v_record.yearly_amount, 0);
                END IF;
                v_einheiten := v_jahreseuros / 12;

                -- Storno für alte Person (falls vorhanden)
                IF OLD.recruited_by_id IS NOT NULL THEN
                    INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
                    VALUES (OLD.recruited_by_id, v_record.id, NEW.recruitment_type, 'storno', -v_einheiten, v_record.kw, v_record.year, v_record.start_date,
                            CASE NEW.recruitment_type WHEN 'recruiting' THEN 'Recruiting geändert' ELSE 'Empfehlung geändert' END,
                            v_record.campaign_id, v_record.campaign_area_id, v_record.customer_id);
                END IF;

                -- Buchung für neue Person (falls vorhanden)
                IF NEW.recruited_by_id IS NOT NULL THEN
                    INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
                    VALUES (NEW.recruited_by_id, v_record.id, NEW.recruitment_type, 'provision', v_einheiten, v_record.kw, v_record.year, v_record.start_date,
                            CASE NEW.recruitment_type WHEN 'recruiting' THEN 'Recruiting zugewiesen' ELSE 'Empfehlung zugewiesen' END,
                            v_record.campaign_id, v_record.campaign_area_id, v_record.customer_id);
                END IF;
            END LOOP;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_user_recruitment_change ON public.user_recruitments;
CREATE TRIGGER trigger_user_recruitment_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_recruitments
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_recruitment_change();

-- ============================================================================
-- 2. TRIGGER-FUNKTION: Neuer Record → Recruiting/Empfehlung aus user_recruitments
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_recruitment_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_recruitment RECORD;
    v_einheiten DECIMAL(10,4);
    v_jahreseuros DECIMAL(10,2);
BEGIN
    -- Nur bei aktiven Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- Einheiten berechnen
    IF NEW.record_type = 'erhoehung' THEN
        v_jahreseuros := COALESCE(NEW.increase_amount, 0);
    ELSE
        v_jahreseuros := COALESCE(NEW.yearly_amount, 0);
    END IF;
    v_einheiten := v_jahreseuros / 12;

    -- Alle Recruitments für diesen Werber finden
    FOR v_recruitment IN
        SELECT recruited_by_id, recruitment_type
        FROM user_recruitments
        WHERE user_id = NEW.werber_id
    LOOP
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        VALUES (v_recruitment.recruited_by_id, NEW.id, v_recruitment.recruitment_type, 'provision', v_einheiten, NEW.kw, NEW.year, NEW.start_date,
                CASE v_recruitment.recruitment_type WHEN 'recruiting' THEN 'Record erstellt' ELSE 'Record erstellt' END,
                NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. BESTEHENDE TRIGGER ANPASSEN (empfehlung_id/recruiting_id entfernen)
-- ============================================================================

-- handle_record_update: Empfehlung/Recruiting Teile entfernen
CREATE OR REPLACE FUNCTION handle_record_update()
RETURNS TRIGGER AS $$
DECLARE
    v_old_jahreseuros DECIMAL(10,2);
    v_new_jahreseuros DECIMAL(10,2);
    v_old_einheiten DECIMAL(10,4);
    v_new_einheiten DECIMAL(10,4);
    v_diff_einheiten DECIMAL(10,4);
    v_diff_jahreseuros DECIMAL(10,2);
    v_recruitment RECORD;
BEGIN
    -- Betrag je nach Record-Typ bestimmen (ALT)
    IF OLD.record_type = 'erhoehung' THEN
        v_old_jahreseuros := COALESCE(OLD.increase_amount, 0);
    ELSE
        v_old_jahreseuros := COALESCE(OLD.yearly_amount, 0);
    END IF;

    -- Betrag je nach Record-Typ bestimmen (NEU)
    IF NEW.record_type = 'erhoehung' THEN
        v_new_jahreseuros := COALESCE(NEW.increase_amount, 0);
    ELSE
        v_new_jahreseuros := COALESCE(NEW.yearly_amount, 0);
    END IF;

    v_old_einheiten := v_old_jahreseuros / 12;
    v_new_einheiten := v_new_jahreseuros / 12;
    v_diff_einheiten := v_new_einheiten - v_old_einheiten;
    v_diff_jahreseuros := v_new_jahreseuros - v_old_jahreseuros;

    -- ========== STORNO (record_status → storno) ==========

    IF OLD.record_status = 'aktiv' AND NEW.record_status = 'storno' THEN
        -- Werber-Ledger: Gegenbuchung für alle Kategorien
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Record storniert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
        FROM provisions_ledger
        WHERE record_id = NEW.id AND typ IN ('provision', 'korrektur')
        GROUP BY user_id, record_id, kategorie;

        -- Kunden-Ledger: Gegenbuchung
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
        SELECT customer_id, record_id, 'storno', -SUM(jahreseuros), NEW.kw, NEW.year, NEW.start_date, 'Record storniert', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id
        FROM customer_billing_ledger
        WHERE record_id = NEW.id AND typ IN ('provision', 'korrektur')
        GROUP BY customer_id, record_id;

        RETURN NEW;
    END IF;

    -- ========== REAKTIVIERUNG (record_status storno → aktiv) ==========

    IF OLD.record_status = 'storno' AND NEW.record_status = 'aktiv' THEN
        -- Werber-Ledger: Neue Buchungen
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        -- TC nur wenn TC ≠ Werber
        IF NEW.teamchef_id IS NOT NULL AND NEW.teamchef_id IS DISTINCT FROM NEW.werber_id THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.teamchef_id, NEW.id, 'teamleitung', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        -- Quality nur wenn Quality ≠ Werber
        IF NEW.quality_id IS NOT NULL AND NEW.quality_id IS DISTINCT FROM NEW.werber_id THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;

        -- Empfehlung/Recruiting über user_recruitments
        FOR v_recruitment IN
            SELECT recruited_by_id, recruitment_type
            FROM user_recruitments
            WHERE user_id = NEW.werber_id
        LOOP
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (v_recruitment.recruited_by_id, NEW.id, v_recruitment.recruitment_type, 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END LOOP;

        -- Kunden-Ledger: Neue Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
            VALUES (NEW.customer_id, NEW.id, 'provision', v_new_jahreseuros, NEW.kw, NEW.year, NEW.start_date, 'Record reaktiviert', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
        END IF;

        RETURN NEW;
    END IF;

    -- Ab hier nur für aktive Records
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- ========== BETRAGS-ÄNDERUNG ==========

    IF v_old_jahreseuros IS DISTINCT FROM v_new_jahreseuros THEN
        -- Werber-Ledger: Korrektur-Buchung für alle bestehenden Kategorien
        INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
        SELECT DISTINCT user_id, record_id, kategorie, 'korrektur', v_diff_einheiten, NEW.kw, NEW.year, NEW.start_date,
               'Betrag geändert: ' || v_old_jahreseuros || ' → ' || v_new_jahreseuros,
               NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
        FROM provisions_ledger
        WHERE record_id = NEW.id AND typ IN ('provision', 'korrektur')
        GROUP BY user_id, kategorie, record_id;

        -- Kunden-Ledger: Korrektur-Buchung
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
            VALUES (NEW.customer_id, NEW.id, 'korrektur', v_diff_jahreseuros, NEW.kw, NEW.year, NEW.start_date,
                   'Betrag geändert: ' || v_old_jahreseuros || ' → ' || v_new_jahreseuros,
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

            -- Alte Recruiting/Empfehlung Buchungen stornieren
            FOR v_recruitment IN
                SELECT recruited_by_id, recruitment_type
                FROM user_recruitments
                WHERE user_id = OLD.werber_id
            LOOP
                INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
                SELECT user_id, record_id, kategorie, 'storno', -SUM(einheiten), NEW.kw, NEW.year, NEW.start_date, 'Werber geändert', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id
                FROM provisions_ledger
                WHERE record_id = NEW.id AND kategorie = v_recruitment.recruitment_type AND user_id = v_recruitment.recruited_by_id
                GROUP BY user_id, record_id, kategorie;
            END LOOP;
        END IF;

        -- Neuer Werber: Buchung
        IF NEW.werber_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.werber_id, NEW.id, 'werben', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Werber zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);

            -- Neue Recruiting/Empfehlung Buchungen
            FOR v_recruitment IN
                SELECT recruited_by_id, recruitment_type
                FROM user_recruitments
                WHERE user_id = NEW.werber_id
            LOOP
                INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
                VALUES (v_recruitment.recruited_by_id, NEW.id, v_recruitment.recruitment_type, 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Werber zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
            END LOOP;
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

        IF NEW.teamchef_id IS NOT NULL AND NEW.teamchef_id IS DISTINCT FROM NEW.werber_id THEN
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

        IF NEW.quality_id IS NOT NULL AND NEW.quality_id IS DISTINCT FROM NEW.werber_id THEN
            INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
            VALUES (NEW.quality_id, NEW.id, 'quality', 'provision', v_new_einheiten, NEW.kw, NEW.year, NEW.start_date, 'Quality zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.customer_id);
        END IF;
    END IF;

    -- HINWEIS: Empfehlung/Recruiting Änderungen werden jetzt über user_recruitments Trigger behandelt

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
            VALUES (NEW.customer_id, NEW.id, 'provision', v_new_jahreseuros, NEW.kw, NEW.year, NEW.start_date, 'Kunde zugewiesen', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- handle_record_insert: Empfehlung/Recruiting Teil entfernen
CREATE OR REPLACE FUNCTION handle_record_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_einheiten DECIMAL(10,4);
    v_jahreseuros DECIMAL(10,2);
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

    -- 4. Empfehlung/Recruiting über handle_record_recruitment_on_insert (separater Trigger)

    -- ========== KUNDEN-LEDGER ==========

    IF NEW.customer_id IS NOT NULL THEN
        INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, werber_id)
        VALUES (NEW.customer_id, NEW.id, 'provision', v_jahreseuros, NEW.kw, NEW.year, NEW.start_date, 'Record erstellt', NEW.campaign_id, NEW.campaign_area_id, NEW.werber_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Neuen Trigger für Recruiting/Empfehlung bei Record-Insert
DROP TRIGGER IF EXISTS trigger_record_recruitment_insert ON public.records;
CREATE TRIGGER trigger_record_recruitment_insert
    AFTER INSERT ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION handle_record_recruitment_on_insert();

-- ============================================================================
-- 4. BESTEHENDE LEDGER-EINTRÄGE MIGRIEREN
-- ============================================================================

-- Alte recruiting/empfehlung Einträge basierend auf records.recruiting_id/empfehlung_id
-- bleiben erhalten - sie sind bereits korrekt gebucht.
-- Neue Einträge über user_recruitments werden zusätzlich erstellt wenn gewünscht.

-- Optional: Bestehende user_recruitments Einträge verarbeiten
-- (Falls bereits Einträge vorhanden sind, aber noch keine Ledger-Buchungen)

DO $$
DECLARE
    v_recruitment RECORD;
    v_record RECORD;
    v_einheiten DECIMAL(10,4);
    v_jahreseuros DECIMAL(10,2);
    v_existing_count INTEGER;
BEGIN
    -- Für jede user_recruitment Beziehung
    FOR v_recruitment IN
        SELECT ur.user_id, ur.recruited_by_id, ur.recruitment_type
        FROM user_recruitments ur
    LOOP
        -- Prüfen ob bereits Ledger-Einträge für diese Kombination existieren
        SELECT COUNT(*) INTO v_existing_count
        FROM provisions_ledger pl
        JOIN records r ON r.id = pl.record_id
        WHERE pl.user_id = v_recruitment.recruited_by_id
        AND pl.kategorie = v_recruitment.recruitment_type
        AND r.werber_id = v_recruitment.user_id;

        -- Wenn keine Einträge existieren, erstellen
        IF v_existing_count = 0 THEN
            FOR v_record IN
                SELECT r.id, r.record_type, r.yearly_amount, r.increase_amount,
                       r.kw, r.year, r.start_date, r.campaign_id, r.campaign_area_id, r.customer_id
                FROM records r
                WHERE r.werber_id = v_recruitment.user_id
                AND r.record_status = 'aktiv'
            LOOP
                IF v_record.record_type = 'erhoehung' THEN
                    v_jahreseuros := COALESCE(v_record.increase_amount, 0);
                ELSE
                    v_jahreseuros := COALESCE(v_record.yearly_amount, 0);
                END IF;
                v_einheiten := v_jahreseuros / 12;

                INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung, campaign_id, campaign_area_id, customer_id)
                VALUES (v_recruitment.recruited_by_id, v_record.id, v_recruitment.recruitment_type, 'provision', v_einheiten, v_record.kw, v_record.year, v_record.start_date,
                        'Migration: ' || v_recruitment.recruitment_type,
                        v_record.campaign_id, v_record.campaign_area_id, v_record.customer_id);
            END LOOP;
        END IF;
    END LOOP;

    RAISE NOTICE 'Migration abgeschlossen: user_recruitments → provisions_ledger';
END $$;

-- ============================================================================
-- 5. SPALTEN ENTFERNEN (recruiting_id, empfehlung_id aus records)
-- ============================================================================

-- Erst prüfen ob Spalten existieren, dann entfernen
DO $$
BEGIN
    -- recruiting_id entfernen
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'records' AND column_name = 'recruiting_id') THEN
        ALTER TABLE public.records DROP COLUMN recruiting_id;
        RAISE NOTICE 'Spalte recruiting_id entfernt';
    END IF;

    -- empfehlung_id entfernen
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'records' AND column_name = 'empfehlung_id') THEN
        ALTER TABLE public.records DROP COLUMN empfehlung_id;
        RAISE NOTICE 'Spalte empfehlung_id entfernt';
    END IF;
END $$;

-- ============================================================================
-- ZUSAMMENFASSUNG
-- ============================================================================
--
-- NEUES SYSTEM:
-- 1. user_recruitments: Zentrale Tabelle für "Wer hat wen rekrutiert/empfohlen"
-- 2. Trigger auf user_recruitments: Bei INSERT/UPDATE/DELETE → Ledger-Buchungen
-- 3. Trigger auf records: Bei neuem Record → Sucht in user_recruitments
--
-- FLOW:
-- A) Im Profil wird eingetragen: "Maya wurde von Burak rekrutiert"
--    → Trigger erstellt für ALLE Records von Maya Buchungen für Burak
--
-- B) Maya schreibt neuen Record
--    → Trigger findet in user_recruitments: "Maya wurde von Burak rekrutiert"
--    → Erstellt Buchung für Burak
--
-- C) Recruiting wird geändert: Burak → Diana
--    → Storno für Burak (alle Records von Maya)
--    → Neue Buchungen für Diana (alle Records von Maya)
--
