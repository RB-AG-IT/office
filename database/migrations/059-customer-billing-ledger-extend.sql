-- Migration 059: Customer Billing Ledger erweitern für Folgevergütung

ALTER TABLE customer_billing_ledger
ADD COLUMN IF NOT EXISTS verguetungsjahr INTEGER CHECK (verguetungsjahr BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS entitlement_id UUID REFERENCES record_entitlements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ist_korrektur BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS korrektur_grund TEXT;

CREATE INDEX IF NOT EXISTS idx_billing_ledger_vj ON customer_billing_ledger(verguetungsjahr);
CREATE INDEX IF NOT EXISTS idx_billing_ledger_entitlement ON customer_billing_ledger(entitlement_id);
