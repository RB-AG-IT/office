-- Migration 063: Storno-Handling für Record Entitlements

CREATE OR REPLACE FUNCTION handle_record_storno()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nur bei Status-Änderung zu 'storno'
    IF NEW.status = 'storno' AND (OLD.status IS NULL OR OLD.status != 'storno') THEN

        -- Nicht abgesicherte, nicht abgerechnete Ansprüche stornieren
        UPDATE record_entitlements
        SET
            status = 'storniert',
            updated_at = now()
        WHERE record_id = NEW.id
          AND status IN ('ausstehend', 'faellig')
          AND ist_abgesichert = false;

        -- Abgesicherte Ansprüche behalten ihren Status
        -- Bereits abgerechnete bleiben 'abgerechnet' (Gutschrift erfolgt bei nächster Rechnung)

    -- Bei Reaktivierung (storno → aktiv)
    ELSIF OLD.status = 'storno' AND NEW.status = 'aktiv' THEN

        -- Stornierte Ansprüche wieder aktivieren
        UPDATE record_entitlements
        SET
            status = CASE
                WHEN faellig_ab <= CURRENT_DATE THEN 'faellig'
                ELSE 'ausstehend'
            END,
            updated_at = now()
        WHERE record_id = NEW.id
          AND status = 'storniert';

    END IF;

    RETURN NEW;
END;
$$;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_handle_record_storno ON records;
CREATE TRIGGER trigger_handle_record_storno
    AFTER UPDATE ON records
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_record_storno();
