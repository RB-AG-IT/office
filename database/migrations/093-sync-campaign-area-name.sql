-- Migration 093: ENTFERNT - Trigger war für campaign_areas.name Sync, Spalte wurde gelöscht

DROP TRIGGER IF EXISTS trg_sync_campaign_area_name ON customer_areas;
DROP FUNCTION IF EXISTS sync_campaign_area_name();
