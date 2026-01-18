-- Migration: campaign_id zu euro_ledger hinzufügen
-- Ermöglicht Unterkunftskosten pro Kampagne separat zu tracken

ALTER TABLE public.euro_ledger
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_euro_ledger_campaign_id ON euro_ledger(campaign_id);
