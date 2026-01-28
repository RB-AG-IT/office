-- Migration 081: DRK Kosten-Ledger Tabelle + View
-- Kosten-Tracking-System für DRK-Abrechnungen

-- 1. Haupttabelle für Kosten-Buchungen
CREATE TABLE public.drk_cost_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
    campaign_area_id UUID NOT NULL REFERENCES public.campaign_areas(id),
    invoice_id UUID REFERENCES public.invoices(id),

    kostenart TEXT NOT NULL,  -- kfz, unterkunft, verpflegung, kleidung, ausweise, sonderposten_*
    pro TEXT NOT NULL,        -- team, person
    zeitraum TEXT NOT NULL,   -- tag, woche, abschnitt, einmalig

    typ TEXT NOT NULL,        -- buchung, storno, korrektur
    betrag DECIMAL(10,2) NOT NULL,
    einheiten DECIMAL(10,2) NOT NULL DEFAULT 1,
    einzelbetrag DECIMAL(10,2) NOT NULL,

    kw INTEGER CHECK (kw >= 1 AND kw <= 53),
    year INTEGER,
    bezeichnung TEXT,
    beschreibung TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. View für offene Kosten pro Kunde
CREATE VIEW public.drk_cost_summary AS
SELECT
    customer_id,
    SUM(CASE WHEN invoice_id IS NULL THEN betrag ELSE 0 END) as offene_kosten,
    SUM(betrag) as gesamt_kosten
FROM drk_cost_ledger
GROUP BY customer_id;

-- 3. Indizes für Performance
CREATE INDEX idx_drk_cost_ledger_customer ON drk_cost_ledger(customer_id);
CREATE INDEX idx_drk_cost_ledger_campaign ON drk_cost_ledger(campaign_id);
CREATE INDEX idx_drk_cost_ledger_invoice ON drk_cost_ledger(invoice_id);
CREATE INDEX idx_drk_cost_ledger_area ON drk_cost_ledger(campaign_area_id);
CREATE INDEX idx_drk_cost_ledger_kw_year ON drk_cost_ledger(kw, year);
CREATE INDEX idx_drk_cost_ledger_open ON drk_cost_ledger(customer_id) WHERE invoice_id IS NULL;

-- 4. RLS aktivieren
ALTER TABLE drk_cost_ledger ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Alles erlauben für service_role
CREATE POLICY "Allow all for service_role" ON drk_cost_ledger
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Alte Pro-Werte in campaign_areas.kosten migrieren
UPDATE campaign_areas
SET kosten = jsonb_set(
    kosten,
    '{unterkunft,pro}',
    CASE WHEN kosten->'unterkunft'->>'pro' IN ('nacht', 'person') THEN '"person"' ELSE '"team"' END::jsonb
)
WHERE kosten IS NOT NULL AND kosten->'unterkunft'->>'pro' IS NOT NULL;

UPDATE campaign_areas
SET kosten = jsonb_set(
    kosten,
    '{verpflegung,pro}',
    CASE WHEN kosten->'verpflegung'->>'pro' IN ('tag', 'person') THEN '"person"' ELSE '"team"' END::jsonb
)
WHERE kosten IS NOT NULL AND kosten->'verpflegung'->>'pro' IS NOT NULL;

UPDATE campaign_areas
SET kosten = jsonb_set(
    kosten,
    '{kleidung,pro}',
    CASE WHEN kosten->'kleidung'->>'pro' IN ('stueck', 'person') THEN '"person"' ELSE '"team"' END::jsonb
)
WHERE kosten IS NOT NULL AND kosten->'kleidung'->>'pro' IS NOT NULL;

UPDATE campaign_areas
SET kosten = jsonb_set(
    kosten,
    '{ausweise,pro}',
    CASE WHEN kosten->'ausweise'->>'pro' IN ('stueck', 'person') THEN '"person"' ELSE '"team"' END::jsonb
)
WHERE kosten IS NOT NULL AND kosten->'ausweise'->>'pro' IS NOT NULL;

-- 7. Alte Zeitraum-Werte (monat → abschnitt) migrieren
UPDATE campaign_areas
SET kosten = jsonb_set(kosten, '{kfz,zeitraum}', '"abschnitt"'::jsonb)
WHERE kosten->'kfz'->>'zeitraum' = 'monat';

UPDATE campaign_areas
SET kosten = jsonb_set(kosten, '{unterkunft,zeitraum}', '"abschnitt"'::jsonb)
WHERE kosten->'unterkunft'->>'zeitraum' = 'monat';

UPDATE campaign_areas
SET kosten = jsonb_set(kosten, '{verpflegung,zeitraum}', '"abschnitt"'::jsonb)
WHERE kosten->'verpflegung'->>'zeitraum' = 'monat';

UPDATE campaign_areas
SET kosten = jsonb_set(kosten, '{kleidung,zeitraum}', '"abschnitt"'::jsonb)
WHERE kosten->'kleidung'->>'zeitraum' = 'monat';

UPDATE campaign_areas
SET kosten = jsonb_set(kosten, '{ausweise,zeitraum}', '"abschnitt"'::jsonb)
WHERE kosten->'ausweise'->>'zeitraum' = 'monat';

-- 8. Sonderposten: pp → person
UPDATE campaign_areas
SET sonderposten = (
    SELECT jsonb_agg(
        CASE
            WHEN sp->>'pro' = 'pp' THEN jsonb_set(sp, '{pro}', '"person"'::jsonb)
            WHEN sp->>'pro' = '' OR sp->>'pro' IS NULL THEN jsonb_set(sp, '{pro}', '"team"'::jsonb)
            ELSE sp
        END
    )
    FROM jsonb_array_elements(sonderposten) sp
)
WHERE sonderposten IS NOT NULL AND jsonb_array_length(sonderposten) > 0;

COMMENT ON TABLE drk_cost_ledger IS 'DRK Kosten-Ledger: Tracking aller Kostenbuchungen für DRK-Abrechnungen';
COMMENT ON VIEW drk_cost_summary IS 'Aggregierte Kostenübersicht pro Kunde (offen vs. gesamt)';
