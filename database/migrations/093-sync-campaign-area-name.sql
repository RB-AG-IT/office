-- Migration 093: Trigger zum Synchronisieren von campaign_areas.name bei Änderung in customer_areas
-- Hält die Kopie in campaign_areas.name aktuell als Backup/Snapshot

CREATE OR REPLACE FUNCTION sync_campaign_area_name()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campaign_areas
    SET name = NEW.name
    WHERE customer_area_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_campaign_area_name
AFTER UPDATE OF name ON customer_areas
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION sync_campaign_area_name();
