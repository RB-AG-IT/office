-- Migration: USt-Zeitraum für Botschafter
-- Fügt Felder für den Gültigkeitszeitraum der Umsatzsteuerpflicht hinzu

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS vat_valid_from DATE,
ADD COLUMN IF NOT EXISTS vat_valid_until DATE;

COMMENT ON COLUMN user_profiles.vat_valid_from IS 'USt gültig ab diesem Datum';
COMMENT ON COLUMN user_profiles.vat_valid_until IS 'USt gültig bis zu diesem Datum (NULL = unbegrenzt)';
