-- ============================================================================
-- Migration 018: Provision Update Trigger
-- ============================================================================
-- Trigger für nachträgliche Änderungen an TC, Quality, Empfehlung, Recruiting
-- Logik: Undo + Neu eintragen (wie bei Storno)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_record_provision_update()
RETURNS TRIGGER AS $$
DECLARE
    v_faktor DECIMAL(10,2);
    v_vorschuss_anteil DECIMAL(5,2);
    v_einheiten DECIMAL(10,2);
    v_provision DECIMAL(10,2);
    v_vorschuss DECIMAL(10,2);
    v_stornorucklage DECIMAL(10,2);
BEGIN
    -- Nur bei aktiven Records Provisionen berechnen
    IF NEW.record_status != 'aktiv' THEN
        RETURN NEW;
    END IF;

    -- Einheiten berechnen (Jahreseuros / 12)
    v_einheiten := COALESCE(NEW.yearly_amount, 0) / 12;

    -- ========================================
    -- TEAMLEITUNG (teamchef_id)
    -- ========================================
    IF OLD.teamchef_id IS DISTINCT FROM NEW.teamchef_id THEN
        -- Alte TC-Provision stornieren (falls vorhanden)
        IF OLD.teamchef_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            SELECT
                user_id,
                kategorie,
                record_id,
                'storno',
                vorschuss_anteil,
                -betrag_provision,
                -betrag_vorschuss,
                -betrag_stornorucklage
            FROM provisions_ledger
            WHERE record_id = NEW.id
              AND kategorie = 'teamleitung'
              AND typ = 'provision'
              AND user_id = OLD.teamchef_id;
        END IF;

        -- Neue TC-Provision eintragen (falls neuer TC gesetzt)
        IF NEW.teamchef_id IS NOT NULL THEN
            SELECT COALESCE(factor, 0), COALESCE(
                (SELECT advance_rate FROM user_profiles WHERE user_id = NEW.teamchef_id), 70
            ) INTO v_faktor, v_vorschuss_anteil
            FROM user_roles
            WHERE user_id = NEW.teamchef_id AND role_type = 'career' AND is_active = true
            ORDER BY assigned_at DESC LIMIT 1;

            v_faktor := COALESCE(v_faktor, 0);
            v_vorschuss_anteil := COALESCE(v_vorschuss_anteil, 70);
            v_provision := v_einheiten * v_faktor;
            v_vorschuss := v_provision * (v_vorschuss_anteil / 100);
            v_stornorucklage := v_provision - v_vorschuss;

            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            VALUES (NEW.teamchef_id, 'teamleitung', NEW.id, 'provision', v_vorschuss_anteil, v_provision, v_vorschuss, v_stornorucklage);
        END IF;
    END IF;

    -- ========================================
    -- QUALITY (quality_id)
    -- ========================================
    IF OLD.quality_id IS DISTINCT FROM NEW.quality_id THEN
        -- Alte Quality-Provision stornieren
        IF OLD.quality_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            SELECT
                user_id,
                kategorie,
                record_id,
                'storno',
                vorschuss_anteil,
                -betrag_provision,
                -betrag_vorschuss,
                -betrag_stornorucklage
            FROM provisions_ledger
            WHERE record_id = NEW.id
              AND kategorie = 'quality'
              AND typ = 'provision'
              AND user_id = OLD.quality_id;
        END IF;

        -- Neue Quality-Provision eintragen
        IF NEW.quality_id IS NOT NULL THEN
            SELECT COALESCE(factor, 0), COALESCE(
                (SELECT advance_rate FROM user_profiles WHERE user_id = NEW.quality_id), 70
            ) INTO v_faktor, v_vorschuss_anteil
            FROM user_roles
            WHERE user_id = NEW.quality_id AND role_type = 'career' AND is_active = true
            ORDER BY assigned_at DESC LIMIT 1;

            v_faktor := COALESCE(v_faktor, 0);
            v_vorschuss_anteil := COALESCE(v_vorschuss_anteil, 70);
            v_provision := v_einheiten * v_faktor;
            v_vorschuss := v_provision * (v_vorschuss_anteil / 100);
            v_stornorucklage := v_provision - v_vorschuss;

            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            VALUES (NEW.quality_id, 'quality', NEW.id, 'provision', v_vorschuss_anteil, v_provision, v_vorschuss, v_stornorucklage);
        END IF;
    END IF;

    -- ========================================
    -- EMPFEHLUNG (empfehlung_id)
    -- ========================================
    IF OLD.empfehlung_id IS DISTINCT FROM NEW.empfehlung_id THEN
        -- Alte Empfehlung-Provision stornieren
        IF OLD.empfehlung_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            SELECT
                user_id,
                kategorie,
                record_id,
                'storno',
                vorschuss_anteil,
                -betrag_provision,
                -betrag_vorschuss,
                -betrag_stornorucklage
            FROM provisions_ledger
            WHERE record_id = NEW.id
              AND kategorie = 'empfehlung'
              AND typ = 'provision'
              AND user_id = OLD.empfehlung_id;
        END IF;

        -- Neue Empfehlung-Provision eintragen
        IF NEW.empfehlung_id IS NOT NULL THEN
            SELECT COALESCE(factor, 0), COALESCE(
                (SELECT advance_rate FROM user_profiles WHERE user_id = NEW.empfehlung_id), 70
            ) INTO v_faktor, v_vorschuss_anteil
            FROM user_roles
            WHERE user_id = NEW.empfehlung_id AND role_type = 'career' AND is_active = true
            ORDER BY assigned_at DESC LIMIT 1;

            v_faktor := COALESCE(v_faktor, 0);
            v_vorschuss_anteil := COALESCE(v_vorschuss_anteil, 70);
            v_provision := v_einheiten * v_faktor;
            v_vorschuss := v_provision * (v_vorschuss_anteil / 100);
            v_stornorucklage := v_provision - v_vorschuss;

            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            VALUES (NEW.empfehlung_id, 'empfehlung', NEW.id, 'provision', v_vorschuss_anteil, v_provision, v_vorschuss, v_stornorucklage);
        END IF;
    END IF;

    -- ========================================
    -- RECRUITING (recruiting_id)
    -- ========================================
    IF OLD.recruiting_id IS DISTINCT FROM NEW.recruiting_id THEN
        -- Alte Recruiting-Provision stornieren
        IF OLD.recruiting_id IS NOT NULL THEN
            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            SELECT
                user_id,
                kategorie,
                record_id,
                'storno',
                vorschuss_anteil,
                -betrag_provision,
                -betrag_vorschuss,
                -betrag_stornorucklage
            FROM provisions_ledger
            WHERE record_id = NEW.id
              AND kategorie = 'recruiting'
              AND typ = 'provision'
              AND user_id = OLD.recruiting_id;
        END IF;

        -- Neue Recruiting-Provision eintragen
        IF NEW.recruiting_id IS NOT NULL THEN
            SELECT COALESCE(factor, 0), COALESCE(
                (SELECT advance_rate FROM user_profiles WHERE user_id = NEW.recruiting_id), 70
            ) INTO v_faktor, v_vorschuss_anteil
            FROM user_roles
            WHERE user_id = NEW.recruiting_id AND role_type = 'career' AND is_active = true
            ORDER BY assigned_at DESC LIMIT 1;

            v_faktor := COALESCE(v_faktor, 0);
            v_vorschuss_anteil := COALESCE(v_vorschuss_anteil, 70);
            v_provision := v_einheiten * v_faktor;
            v_vorschuss := v_provision * (v_vorschuss_anteil / 100);
            v_stornorucklage := v_provision - v_vorschuss;

            INSERT INTO provisions_ledger (user_id, kategorie, record_id, typ, vorschuss_anteil, betrag_provision, betrag_vorschuss, betrag_stornorucklage)
            VALUES (NEW.recruiting_id, 'recruiting', NEW.id, 'provision', v_vorschuss_anteil, v_provision, v_vorschuss, v_stornorucklage);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger erstellen
DROP TRIGGER IF EXISTS on_record_assignment_change ON public.records;
CREATE TRIGGER on_record_assignment_change
    AFTER UPDATE ON public.records
    FOR EACH ROW
    WHEN (
        OLD.teamchef_id IS DISTINCT FROM NEW.teamchef_id OR
        OLD.quality_id IS DISTINCT FROM NEW.quality_id OR
        OLD.empfehlung_id IS DISTINCT FROM NEW.empfehlung_id OR
        OLD.recruiting_id IS DISTINCT FROM NEW.recruiting_id
    )
    EXECUTE FUNCTION handle_record_provision_update();
