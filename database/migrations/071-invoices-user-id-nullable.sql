-- Migration 071: user_id nullable machen für DRK-Kundenrechnungen
-- DRK-Rechnungen haben customer_id statt user_id

ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN invoices.user_id IS
'User-ID für Botschafter-Rechnungen. NULL bei DRK-Kundenrechnungen (dort wird customer_id verwendet).';
