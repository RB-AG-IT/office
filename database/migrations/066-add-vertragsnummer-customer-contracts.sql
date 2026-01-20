-- Migration 066: Vertragsnummer zu customer_contracts hinzufügen
-- Grund: Jeder hochgeladene Vertrag soll eine Vertragsnummer bekommen können

ALTER TABLE customer_contracts
ADD COLUMN IF NOT EXISTS vertragsnummer VARCHAR;

COMMENT ON COLUMN customer_contracts.vertragsnummer IS 'Vertragsnummer z.B. 025/RV/00412';
