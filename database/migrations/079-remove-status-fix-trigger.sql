-- Migration 079: Status/Synced-Felder entfernen und Storno-Trigger korrigieren
-- Das 'status'-Feld (pending/success) war ein Sync-Status, der nie abgefragt wurde.
-- Das 'synced'-Feld war ebenfalls ungenutzt.
-- Der Trigger verwendete fälschlicherweise 'status' statt 'record_status'.

-- 1. Ungenutzte Spalten entfernen
ALTER TABLE records DROP COLUMN IF EXISTS status;
ALTER TABLE records DROP COLUMN IF EXISTS synced;

-- 2. Trigger korrigieren: status → record_status
CREATE OR REPLACE FUNCTION handle_record_storno()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Nur bei Status-Änderung zu 'storno'
    IF NEW.record_status = 'storno' AND (OLD.record_status IS NULL OR OLD.record_status != 'storno') THEN

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
    ELSIF OLD.record_status = 'storno' AND NEW.record_status = 'aktiv' THEN

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

-- Trigger neu erstellen mit korrekter Spalte
DROP TRIGGER IF EXISTS trigger_handle_record_storno ON records;
CREATE TRIGGER trigger_handle_record_storno
    AFTER UPDATE ON records
    FOR EACH ROW
    WHEN (OLD.record_status IS DISTINCT FROM NEW.record_status)
    EXECUTE FUNCTION handle_record_storno();

COMMENT ON FUNCTION handle_record_storno IS 'Aktualisiert Entitlements bei Storno/Reaktivierung eines Records (korrigiert: verwendet record_status)';
