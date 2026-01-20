-- Migration 064: DRK Rechnungsnummern-Generierung
-- Format: [JJ]-[Empfänger]-[KundenNr]-[Typ]-[Nummer]
-- Beispiel: 026-OV-023-ZA-00422

-- Funktion zur Generierung der nächsten fortlaufenden Nummer
CREATE OR REPLACE FUNCTION get_next_drk_invoice_nr()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_nr INTEGER;
BEGIN
    SELECT COALESCE(MAX(fortlaufende_nr), 0) + 1
    INTO v_max_nr
    FROM invoices
    WHERE fortlaufende_nr IS NOT NULL;

    RETURN v_max_nr;
END;
$$;

-- Funktion zur Generierung der vollständigen Rechnungsnummer
CREATE OR REPLACE FUNCTION generate_drk_invoice_number(
    p_empfaenger_typ TEXT,
    p_kunden_nr TEXT,
    p_abrechnungstyp TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT;
    v_nr INTEGER;
BEGIN
    v_year := TO_CHAR(NOW(), 'YY');
    v_nr := get_next_drk_invoice_nr();

    RETURN v_year || '-' || p_empfaenger_typ || '-' || p_kunden_nr || '-' || p_abrechnungstyp || '-' || LPAD(v_nr::TEXT, 5, '0');
END;
$$;

-- Trigger-Funktion: Rechnungsnummer bei Status 'offen' setzen
CREATE OR REPLACE FUNCTION set_drk_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nur für DRK-Rechnungen (customer_id gesetzt) und wenn Status auf 'offen' wechselt
    IF NEW.customer_id IS NOT NULL
       AND NEW.status = 'offen'
       AND (OLD.status IS NULL OR OLD.status = 'entwurf')
       AND NEW.invoice_number IS NULL
       AND NEW.abrechnungstyp IS NOT NULL
    THEN
        NEW.fortlaufende_nr := get_next_drk_invoice_nr();
        NEW.invoice_number := generate_drk_invoice_number(
            COALESCE(NEW.empfaenger_typ, 'OV'),
            COALESCE(NEW.kunden_nr, '000'),
            NEW.abrechnungstyp
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_set_drk_invoice_number ON invoices;
CREATE TRIGGER trigger_set_drk_invoice_number
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_drk_invoice_number();

-- Auch bei INSERT (falls direkt mit status='offen' erstellt)
DROP TRIGGER IF EXISTS trigger_set_drk_invoice_number_insert ON invoices;
CREATE TRIGGER trigger_set_drk_invoice_number_insert
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_drk_invoice_number();
