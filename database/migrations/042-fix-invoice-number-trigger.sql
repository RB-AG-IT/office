-- Migration: Fix lpad Bug in Invoice Number Trigger
-- Datum: 2026-01-18
-- Beschreibung: LPAD braucht TEXT als ersten Parameter, nicht INTEGER

-- 1. Funktion für Rechnungsnummer-Generierung (mit korrektem Cast)
CREATE OR REPLACE FUNCTION generate_invoice_number(invoice_type TEXT, jahr INTEGER)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    -- Prefix basierend auf Typ
    IF invoice_type = 'vorschuss' THEN
        prefix := 'GS-V';  -- Gutschrift Vorschuss
    ELSE
        prefix := 'GS-S';  -- Gutschrift Stornorücklage
    END IF;

    -- Nächste Nummer für dieses Jahr und Typ finden
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_number LIKE prefix || '-' || jahr::TEXT || '-%';

    -- Nummer formatieren: GS-V-2026-0001 (LPAD braucht TEXT!)
    result := prefix || '-' || jahr::TEXT || '-' || LPAD(next_num::TEXT, 4, '0');

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger-Funktion für automatische Rechnungsnummer bei Status-Wechsel
CREATE OR REPLACE FUNCTION assign_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur wenn Status zu 'offen' wechselt und noch keine Nummer vergeben
    IF NEW.status = 'offen' AND (OLD.status = 'entwurf' OR OLD.status IS NULL) AND NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number(NEW.invoice_type, NEW.year);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger erstellen (falls nicht existiert)
DROP TRIGGER IF EXISTS assign_invoice_number_trigger ON public.invoices;
CREATE TRIGGER assign_invoice_number_trigger
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION assign_invoice_number();
