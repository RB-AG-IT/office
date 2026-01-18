-- Migration: Fix invoice_positions typ check constraint
-- Erlaubt alle benötigten Provisionstypen

ALTER TABLE public.invoice_positions DROP CONSTRAINT IF EXISTS invoice_positions_typ_check;

ALTER TABLE public.invoice_positions ADD CONSTRAINT invoice_positions_typ_check
CHECK (typ IN ('werben', 'teamleitung', 'quality', 'empfehlung', 'recruiting'));
