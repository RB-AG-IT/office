-- Migration 076: Fix Spaltenname kunden_id → kd_id

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
    SELECT COALESCE(MAX(CAST(SUBSTRING(kd_id FROM 5 FOR 3) AS INTEGER)), 0)
    INTO v_max_nr
    FROM customers
    WHERE kd_id LIKE 'A' || v_year || '-%';

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
    -- Nur setzen wenn kd_id leer ist
    IF NEW.kd_id IS NULL OR NEW.kd_id = '' THEN
        NEW.kd_id := generate_customer_id();
        -- Auch kunden_nr_ziffern setzen
        NEW.kunden_nr_ziffern := SUBSTRING(NEW.kd_id FROM 5 FOR 3);
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
