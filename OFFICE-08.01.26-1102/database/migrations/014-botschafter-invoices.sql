-- Migration: 014-botschafter-invoices.sql
-- Erstellt Tabellen für Botschafter-Abrechnungssystem

-- ============================================
-- 1. INVOICES (Abrechnungen)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Zuordnung
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,

    -- Abrechnungstyp: 'vorschuss' | 'stornorucklage'
    invoice_type TEXT NOT NULL CHECK (invoice_type IN ('vorschuss', 'stornorucklage')),

    -- Zeitraum
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    kw_start INTEGER,
    kw_end INTEGER,
    year INTEGER NOT NULL,

    -- Beträge (in EUR)
    brutto_provision DECIMAL(12,2) DEFAULT 0,
    vorschuss_betrag DECIMAL(12,2) DEFAULT 0,
    stornorucklage_betrag DECIMAL(12,2) DEFAULT 0,
    abzuege_unterkunft DECIMAL(12,2) DEFAULT 0,
    abzuege_sonderposten DECIMAL(12,2) DEFAULT 0,
    netto_auszahlung DECIMAL(12,2) DEFAULT 0,

    -- Berechnungsgrundlagen (für Nachvollziehbarkeit)
    calculation_data JSONB DEFAULT '{}',
    -- Beispiel: { einheiten: 12, faktor: 6.5, karrierestufe: "EMM", vorschuss_anteil: 75 }

    -- Status: entwurf | freigegeben | versendet | bezahlt
    status TEXT DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'freigegeben', 'versendet', 'bezahlt')),

    -- Geplanter Versand
    scheduled_send_at TIMESTAMP WITH TIME ZONE,

    -- PDF
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,

    -- E-Mail
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_recipient TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Indizes für invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_year ON public.invoices(year);
CREATE INDEX IF NOT EXISTS idx_invoices_scheduled ON public.invoices(scheduled_send_at) WHERE status = 'freigegeben';

-- ============================================
-- 2. INVOICE_ITEMS (Abrechnungspositionen)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,

    -- Positionstyp
    position_type TEXT NOT NULL CHECK (position_type IN (
        'provision',
        'stornorucklage_einbehalt',
        'unterkunft',
        'sonderposten',
        'stornorucklage_auszahlung',
        'storno_abzug'
    )),

    -- Beschreibung
    description TEXT,

    -- Berechnung
    quantity DECIMAL(10,2) DEFAULT 0,      -- Anzahl Einheiten
    unit_price DECIMAL(10,2) DEFAULT 0,    -- Faktor oder Einzelpreis
    amount DECIMAL(12,2) NOT NULL,         -- Summe (kann negativ sein bei Abzügen)

    -- Referenz zum Datensatz (optional)
    record_id UUID,

    -- Zeitraum
    kw INTEGER,
    year INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- ============================================
-- 3. STORNORUCKLAGE_TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.stornorucklage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Halbjahr (H1 = Jan-Jun, H2 = Jul-Dez)
    halbjahr INTEGER NOT NULL CHECK (halbjahr IN (1, 2)),
    year INTEGER NOT NULL,

    -- Beträge
    original_betrag DECIMAL(12,2) NOT NULL DEFAULT 0,
    stornos_verrechnet DECIMAL(12,2) DEFAULT 0,

    -- Auszahlung (2 Jahre Sperrfrist)
    sperrfrist_bis DATE NOT NULL,
    ausgezahlt_am TIMESTAMP WITH TIME ZONE,
    ausgezahlt_betrag DECIMAL(12,2),
    auszahlungs_invoice_id UUID REFERENCES public.invoices(id),

    -- Status: gesperrt | auszahlbar | ausgezahlt
    status TEXT DEFAULT 'gesperrt' CHECK (status IN ('gesperrt', 'auszahlbar', 'ausgezahlt')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, halbjahr, year)
);

-- Index für stornorucklage_tracking
CREATE INDEX IF NOT EXISTS idx_stornorucklage_user ON public.stornorucklage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_stornorucklage_status ON public.stornorucklage_tracking(status);
CREATE INDEX IF NOT EXISTS idx_stornorucklage_sperrfrist ON public.stornorucklage_tracking(sperrfrist_bis);

-- ============================================
-- 4. ABZUEGE (Unterkunft, Sonderposten)
-- ============================================
CREATE TABLE IF NOT EXISTS public.abzuege (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Typ: unterkunft | sonderposten
    abzug_type TEXT NOT NULL CHECK (abzug_type IN ('unterkunft', 'sonderposten')),

    -- Von welchem Betrag abziehen: vorschuss | stornorucklage
    abzug_von TEXT NOT NULL CHECK (abzug_von IN ('vorschuss', 'stornorucklage')),

    -- Details
    beschreibung TEXT,
    betrag DECIMAL(12,2) NOT NULL,

    -- Zeitraum (wann anfallend)
    gueltig_ab DATE,
    gueltig_bis DATE,

    -- Verrechnung
    verrechnet BOOLEAN DEFAULT FALSE,
    verrechnet_in_invoice_id UUID REFERENCES public.invoices(id),
    verrechnet_am TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Index für abzuege
CREATE INDEX IF NOT EXISTS idx_abzuege_user ON public.abzuege(user_id);
CREATE INDEX IF NOT EXISTS idx_abzuege_verrechnet ON public.abzuege(verrechnet) WHERE verrechnet = FALSE;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all invoices"
    ON public.invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own invoices"
    ON public.invoices FOR SELECT
    USING (user_id = auth.uid());

-- invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all invoice_items"
    ON public.invoice_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own invoice_items"
    ON public.invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

-- stornorucklage_tracking
ALTER TABLE public.stornorucklage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stornorucklage"
    ON public.stornorucklage_tracking FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own stornorucklage"
    ON public.stornorucklage_tracking FOR SELECT
    USING (user_id = auth.uid());

-- abzuege
ALTER TABLE public.abzuege ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage abzuege"
    ON public.abzuege FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own abzuege"
    ON public.abzuege FOR SELECT
    USING (user_id = auth.uid());

-- ============================================
-- 6. TRIGGER für updated_at
-- ============================================

-- Funktion für updated_at (falls nicht existiert)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger für stornorucklage_tracking
DROP TRIGGER IF EXISTS update_stornorucklage_updated_at ON public.stornorucklage_tracking;
CREATE TRIGGER update_stornorucklage_updated_at
    BEFORE UPDATE ON public.stornorucklage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. VIEW für offene Stornorücklagen
-- ============================================

CREATE OR REPLACE VIEW public.stornorucklage_uebersicht AS
SELECT
    s.id,
    s.user_id,
    u.name as botschafter_name,
    s.halbjahr,
    s.year,
    s.original_betrag,
    s.stornos_verrechnet,
    (s.original_betrag - s.stornos_verrechnet) as verbleibend,
    s.sperrfrist_bis,
    CASE
        WHEN CURRENT_DATE >= s.sperrfrist_bis AND s.status = 'gesperrt' THEN 'auszahlbar'
        ELSE s.status
    END as aktueller_status,
    s.ausgezahlt_am,
    s.ausgezahlt_betrag
FROM public.stornorucklage_tracking s
LEFT JOIN public.users u ON s.user_id = u.id;

-- ============================================
-- 8. FUNKTION: Nächste Rechnungsnummer
-- ============================================

CREATE OR REPLACE FUNCTION generate_invoice_number(invoice_type TEXT, jahr INTEGER)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    -- Prefix basierend auf Typ
    IF invoice_type = 'vorschuss' THEN
        prefix := 'GS-V';  -- Gutschrift Vorschuss
    ELSE
        prefix := 'GS-S';  -- Gutschrift Stornorücklage
    END IF;

    -- Nächste Nummer für dieses Jahr und Typ finden
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_number LIKE prefix || '-' || jahr || '-%';

    -- Nummer formatieren: GS-V-2026-001
    result := prefix || '-' || jahr || '-' || LPAD(next_num::TEXT, 4, '0');

    RETURN result;
END;
$$ LANGUAGE plpgsql;
