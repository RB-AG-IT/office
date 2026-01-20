-- Migration 055: Invoice Payments (Zahlungshistorie für Teilzahlungen)

CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    betrag_netto DECIMAL(10,2) NOT NULL,
    betrag_ust DECIMAL(10,2) NOT NULL,
    betrag_brutto DECIMAL(10,2) NOT NULL,
    zahlungsdatum DATE NOT NULL,
    notiz TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_datum ON invoice_payments(zahlungsdatum);

-- RLS wird am Ende des Projekts aktiviert
