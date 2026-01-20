-- Migration 061: Kunden-ID Generierung (Format: A[JJ]-[NNN])

-- Funktion zur Generierung der nächsten Kunden-ID
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year TEXT;
    v_max_nr INTEGER;
    v_new_nr TEXT;
BEGIN
    -- Aktuelles Jahr (2-stellig)
    v_year := TO_CHAR(NOW(), 'YY');

    -- Höchste Nummer im aktuellen Jahr finden
    SELECT COALESCE(MAX(CAST(SUBSTRING(kunden_id FROM 5 FOR 3) AS INTEGER)), 0)
    INTO v_max_nr
    FROM customers
    WHERE kunden_id LIKE 'A' || v_year || '-%';

    -- Neue Nummer (3-stellig mit führenden Nullen)
    v_new_nr := LPAD((v_max_nr + 1)::TEXT, 3, '0');

    RETURN 'A' || v_year || '-' || v_new_nr;
END;
$$;

-- Trigger-Funktion für automatische Kunden-ID
CREATE OR REPLACE FUNCTION set_customer_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nur setzen wenn kunden_id leer ist
    IF NEW.kunden_id IS NULL OR NEW.kunden_id = '' THEN
        NEW.kunden_id := generate_customer_id();
        -- Auch kunden_nr_ziffern setzen
        NEW.kunden_nr_ziffern := SUBSTRING(NEW.kunden_id FROM 5 FOR 3);
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_set_customer_id ON customers;
CREATE TRIGGER trigger_set_customer_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_id();
