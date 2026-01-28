-- Migration: Fehlende Felder für Record-Export hinzufügen

-- Späteres Beitrittsdatum
ALTER TABLE records ADD COLUMN IF NOT EXISTS later_join_date DATE;

-- Consent-Felder für E-Mail und Telefon Opt-In
ALTER TABLE records ADD COLUMN IF NOT EXISTS consent_email BOOLEAN DEFAULT false;
ALTER TABLE records ADD COLUMN IF NOT EXISTS consent_phone BOOLEAN DEFAULT false;
