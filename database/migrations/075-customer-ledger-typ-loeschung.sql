-- Migration 075: customer_billing_ledger typ Constraint erweitern für 'loeschung'
-- Problem: 'loeschung' fehlt in der CHECK Constraint (wurde nur in provisions_ledger hinzugefügt)

ALTER TABLE public.customer_billing_ledger
DROP CONSTRAINT IF EXISTS customer_billing_ledger_typ_check;

ALTER TABLE public.customer_billing_ledger
ADD CONSTRAINT customer_billing_ledger_typ_check
CHECK (typ IN ('provision', 'storno', 'korrektur', 'loeschung'));
