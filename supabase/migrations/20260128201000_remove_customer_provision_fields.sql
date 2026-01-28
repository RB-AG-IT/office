-- Migration 088: Entfernt Provision/Kosten-Felder aus customers
-- Diese Felder sind jetzt kampagnenspezifisch in campaign_customer_config

ALTER TABLE customers
DROP COLUMN IF EXISTS provision_sondierung,
DROP COLUMN IF EXISTS provision_regular,
DROP COLUMN IF EXISTS qualitaetsbonus,
DROP COLUMN IF EXISTS qualitaetsbonus_datum,
DROP COLUMN IF EXISTS teilverguetung,
DROP COLUMN IF EXISTS teilv_prozent,
DROP COLUMN IF EXISTS stornopuffer,
DROP COLUMN IF EXISTS endabr_wochen,
DROP COLUMN IF EXISTS kosten,
DROP COLUMN IF EXISTS sonderposten;
