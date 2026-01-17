-- Migration: Euro-Ledger für Abzüge & Zubuchungen
-- Datum: 2026-01-17
-- Ersetzt die alte 'abzuege' Tabelle durch ein professionelles Ledger-System

-- 1. Neue Tabelle erstellen
CREATE TABLE IF NOT EXISTS public.euro_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referenzen
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,

    -- Buchungsdetails
    kategorie TEXT NOT NULL CHECK (kategorie IN ('unterkunft', 'sonderposten', 'sonstiges')),
    typ TEXT NOT NULL CHECK (typ IN ('abzug', 'zubuchung', 'korrektur')),
    betrag DECIMAL(10,2) NOT NULL,  -- Positiv = Zubuchung, Negativ = Abzug

    -- Kontext
    beschreibung TEXT,
    kw INTEGER,
    year INTEGER,
    referenz_datum DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Indizes erstellen
CREATE INDEX IF NOT EXISTS idx_euro_ledger_user_id ON euro_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_euro_ledger_invoice_id ON euro_ledger(invoice_id);
CREATE INDEX IF NOT EXISTS idx_euro_ledger_kategorie ON euro_ledger(kategorie);

-- 3. RLS aktivieren
ALTER TABLE public.euro_ledger ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy erstellen
CREATE POLICY "Service role has full access to euro_ledger"
    ON public.euro_ledger
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Alte Tabelle löschen (nach erfolgreicher Migration)
-- DROP TABLE IF EXISTS public.abzuege;
