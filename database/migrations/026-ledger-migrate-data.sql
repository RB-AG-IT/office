-- ================================================================
-- Migration 026: Bestandsdaten in Ledger migrieren
-- Kopiert campaign_id, campaign_area_id, customer_id/werber_id
-- aus Records in bestehende Ledger-Einträge
-- ================================================================

-- provisions_ledger Bestandsdaten aktualisieren
UPDATE provisions_ledger pl
SET
    campaign_id = r.campaign_id,
    campaign_area_id = r.campaign_area_id,
    customer_id = r.customer_id
FROM records r
WHERE pl.record_id = r.id
  AND (pl.campaign_id IS NULL OR pl.campaign_area_id IS NULL OR pl.customer_id IS NULL);

-- customer_billing_ledger Bestandsdaten aktualisieren
UPDATE customer_billing_ledger cbl
SET
    campaign_id = r.campaign_id,
    campaign_area_id = r.campaign_area_id,
    werber_id = r.werber_id
FROM records r
WHERE cbl.record_id = r.id
  AND (cbl.campaign_id IS NULL OR cbl.campaign_area_id IS NULL OR cbl.werber_id IS NULL);

-- Verifizierung: Zähle Einträge ohne Zuordnung
DO $$
DECLARE
    provisions_missing INTEGER;
    billing_missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO provisions_missing
    FROM provisions_ledger
    WHERE campaign_id IS NULL OR campaign_area_id IS NULL OR customer_id IS NULL;

    SELECT COUNT(*) INTO billing_missing
    FROM customer_billing_ledger
    WHERE campaign_id IS NULL OR campaign_area_id IS NULL OR werber_id IS NULL;

    RAISE NOTICE 'provisions_ledger: % Einträge ohne vollständige Zuordnung', provisions_missing;
    RAISE NOTICE 'customer_billing_ledger: % Einträge ohne vollständige Zuordnung', billing_missing;
END $$;
