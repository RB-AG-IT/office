-- ============================================================================
-- Migration 021: Neue Ledger-Tabellen erstellen
-- ============================================================================
-- Erstellt das neue EH-basierte Ledger-System:
-- - provisions_ledger: Werber-Einheiten (EH)
-- - customer_billing_ledger: Kunden-Jahreseuros
-- ============================================================================

-- ============================================================================
-- 1. WERBER-LEDGER (provisions_ledger)
-- ============================================================================
-- Speichert Einheiten (EH) pro Record und Kategorie
-- Provision wird erst bei Abrechnung berechnet: EH × Faktor

CREATE TABLE IF NOT EXISTS public.provisions_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

    -- Buchungsdetails
    kategorie TEXT NOT NULL CHECK (kategorie IN ('werben', 'teamleitung', 'quality', 'empfehlung', 'recruiting')),
    typ TEXT NOT NULL CHECK (typ IN ('provision', 'storno', 'korrektur')),
    einheiten DECIMAL(10,4) NOT NULL,  -- Kann negativ sein bei Storno

    -- Zeitbezug (wann wurde EH verdient)
    kw INTEGER CHECK (kw >= 1 AND kw <= 53),
    year INTEGER,
    referenz_datum DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    beschreibung TEXT
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_user_id ON provisions_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_record_id ON provisions_ledger(record_id);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_invoice_id ON provisions_ledger(invoice_id);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_kategorie ON provisions_ledger(kategorie);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_kw_year ON provisions_ledger(kw, year);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_created_at ON provisions_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_typ ON provisions_ledger(typ);

-- ============================================================================
-- 2. KUNDEN-LEDGER (customer_billing_ledger)
-- ============================================================================
-- Speichert Jahreseuros pro Record für Kundenabrechnung

CREATE TABLE IF NOT EXISTS public.customer_billing_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.records(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

    -- Buchungsdetails
    typ TEXT NOT NULL CHECK (typ IN ('provision', 'storno', 'korrektur')),
    jahreseuros DECIMAL(10,2) NOT NULL,  -- Kann negativ sein bei Storno

    -- Zeitbezug
    kw INTEGER CHECK (kw >= 1 AND kw <= 53),
    year INTEGER,
    referenz_datum DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    beschreibung TEXT
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_customer_billing_ledger_customer_id ON customer_billing_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_billing_ledger_record_id ON customer_billing_ledger(record_id);
CREATE INDEX IF NOT EXISTS idx_customer_billing_ledger_invoice_id ON customer_billing_ledger(invoice_id);
CREATE INDEX IF NOT EXISTS idx_customer_billing_ledger_kw_year ON customer_billing_ledger(kw, year);
CREATE INDEX IF NOT EXISTS idx_customer_billing_ledger_typ ON customer_billing_ledger(typ);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- provisions_ledger RLS
ALTER TABLE public.provisions_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provisions_ledger_select_policy" ON public.provisions_ledger
    FOR SELECT USING (true);

CREATE POLICY "provisions_ledger_insert_policy" ON public.provisions_ledger
    FOR INSERT WITH CHECK (true);

CREATE POLICY "provisions_ledger_update_policy" ON public.provisions_ledger
    FOR UPDATE USING (true);

-- customer_billing_ledger RLS
ALTER TABLE public.customer_billing_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_billing_ledger_select_policy" ON public.customer_billing_ledger
    FOR SELECT USING (true);

CREATE POLICY "customer_billing_ledger_insert_policy" ON public.customer_billing_ledger
    FOR INSERT WITH CHECK (true);

CREATE POLICY "customer_billing_ledger_update_policy" ON public.customer_billing_ledger
    FOR UPDATE USING (true);

-- ============================================================================
-- HINWEIS: Führe Migration 022 aus, um die Trigger zu erstellen.
-- ============================================================================
