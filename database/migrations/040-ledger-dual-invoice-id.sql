-- Migration: Dual Invoice-ID für Vorschuss und Stornorücklage
-- Datum: 2026-01-17
-- Beschreibung: Trennt die Abrechnung von Vorschuss und Stornorücklage

-- ============================================
-- 1. PROVISIONS_LEDGER
-- ============================================

-- Spalte umbenennen: invoice_id → invoice_id_vorschuss
ALTER TABLE public.provisions_ledger
RENAME COLUMN invoice_id TO invoice_id_vorschuss;

-- Neue Spalte für Stornorücklage-Abrechnung
ALTER TABLE public.provisions_ledger
ADD COLUMN IF NOT EXISTS invoice_id_stornorucklage UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Index für neue Spalte
CREATE INDEX IF NOT EXISTS idx_provisions_ledger_invoice_str
ON public.provisions_ledger(invoice_id_stornorucklage);

-- ============================================
-- 2. EURO_LEDGER (gleiche Änderung)
-- ============================================

-- Spalte umbenennen: invoice_id → invoice_id_vorschuss
ALTER TABLE public.euro_ledger
RENAME COLUMN invoice_id TO invoice_id_vorschuss;

-- Neue Spalte für Stornorücklage-Abrechnung
ALTER TABLE public.euro_ledger
ADD COLUMN IF NOT EXISTS invoice_id_stornorucklage UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Index für neue Spalte
CREATE INDEX IF NOT EXISTS idx_euro_ledger_invoice_str
ON public.euro_ledger(invoice_id_stornorucklage);

-- ============================================
-- 3. RPC FUNKTION AKTUALISIEREN
-- ============================================

CREATE OR REPLACE FUNCTION create_invoice_transaction(input_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_invoice_id UUID;
    v_user_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_year INTEGER;
    v_vorschuss_anteil NUMERIC;
    v_invoice_type TEXT;
    v_provisionen JSONB;
    v_kategorien TEXT[];
    result JSONB;
BEGIN
    -- Parameter extrahieren
    v_user_id := (input_data->>'userId')::UUID;
    v_period_start := (input_data->'zeitraum'->>'von')::DATE;
    v_period_end := (input_data->'zeitraum'->>'bis')::DATE;
    v_year := (input_data->>'year')::INTEGER;
    v_vorschuss_anteil := (input_data->>'vorschussAnteil')::NUMERIC;
    v_invoice_type := COALESCE(input_data->>'invoice_type', 'vorschuss');
    v_provisionen := COALESCE(input_data->'provisionen', '{"werben":0,"teamleitung":0,"quality":0,"empfehlung":0,"recruiting":0}'::JSONB);

    -- Kategorien aus Provisionen ableiten (nur die mit Wert > 0)
    v_kategorien := ARRAY[]::TEXT[];
    IF (v_provisionen->>'werben')::NUMERIC > 0 THEN
        v_kategorien := array_append(v_kategorien, 'werben');
    END IF;
    IF (v_provisionen->>'teamleitung')::NUMERIC > 0 THEN
        v_kategorien := array_append(v_kategorien, 'teamleitung');
    END IF;
    IF (v_provisionen->>'quality')::NUMERIC > 0 THEN
        v_kategorien := array_append(v_kategorien, 'quality');
    END IF;
    IF (v_provisionen->>'empfehlung')::NUMERIC > 0 THEN
        v_kategorien := array_append(v_kategorien, 'empfehlung');
    END IF;
    IF (v_provisionen->>'recruiting')::NUMERIC > 0 THEN
        v_kategorien := array_append(v_kategorien, 'recruiting');
    END IF;

    -- 1. Invoice erstellen
    INSERT INTO invoices (
        user_id,
        invoice_number,
        invoice_type,
        period_start,
        period_end,
        kw_start,
        kw_end,
        year,
        brutto_provision,
        vorschuss_betrag,
        stornorucklage_betrag,
        abzuege_unterkunft,
        abzuege_sonderposten,
        netto_auszahlung,
        gesamt_provision,
        gesamt_vorschuss,
        gesamt_stornorucklage,
        calculation_data,
        status,
        scheduled_send_at
    ) VALUES (
        v_user_id,
        NULL,
        v_invoice_type,
        v_period_start,
        v_period_end,
        (input_data->>'kw_start')::INTEGER,
        (input_data->>'kw_end')::INTEGER,
        v_year,
        (input_data->>'brutto')::NUMERIC,
        (input_data->>'vorschuss')::NUMERIC,
        (input_data->>'stornorucklage')::NUMERIC,
        COALESCE((input_data->>'abzuegeUnterkunft')::NUMERIC, 0),
        COALESCE((input_data->>'abzuegeSonderposten')::NUMERIC, 0),
        (input_data->>'netto')::NUMERIC,
        (input_data->>'gesamtProvision')::NUMERIC,
        (input_data->>'gesamtVorschuss')::NUMERIC,
        (input_data->>'gesamtStornorucklage')::NUMERIC,
        input_data->'calculation_data',
        'entwurf',
        (input_data->>'scheduled_send_at')::TIMESTAMPTZ
    ) RETURNING id INTO new_invoice_id;

    -- 2. Invoice Positions erstellen (nur für Kategorien mit Provision > 0)
    IF (v_provisionen->>'werben')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (
            new_invoice_id,
            'werben',
            (v_provisionen->>'werben')::NUMERIC,
            v_vorschuss_anteil,
            (v_provisionen->>'werben')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'werben')::NUMERIC * (100 - v_vorschuss_anteil) / 100
        );
    END IF;

    IF (v_provisionen->>'teamleitung')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (
            new_invoice_id,
            'teamleitung',
            (v_provisionen->>'teamleitung')::NUMERIC,
            v_vorschuss_anteil,
            (v_provisionen->>'teamleitung')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'teamleitung')::NUMERIC * (100 - v_vorschuss_anteil) / 100
        );
    END IF;

    IF (v_provisionen->>'quality')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (
            new_invoice_id,
            'quality',
            (v_provisionen->>'quality')::NUMERIC,
            v_vorschuss_anteil,
            (v_provisionen->>'quality')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'quality')::NUMERIC * (100 - v_vorschuss_anteil) / 100
        );
    END IF;

    IF (v_provisionen->>'empfehlung')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (
            new_invoice_id,
            'empfehlung',
            (v_provisionen->>'empfehlung')::NUMERIC,
            v_vorschuss_anteil,
            (v_provisionen->>'empfehlung')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'empfehlung')::NUMERIC * (100 - v_vorschuss_anteil) / 100
        );
    END IF;

    IF (v_provisionen->>'recruiting')::NUMERIC > 0 THEN
        INSERT INTO invoice_positions (invoice_id, typ, provision, vorschuss_anteil, vorschuss, stornorucklage)
        VALUES (
            new_invoice_id,
            'recruiting',
            (v_provisionen->>'recruiting')::NUMERIC,
            v_vorschuss_anteil,
            (v_provisionen->>'recruiting')::NUMERIC * v_vorschuss_anteil / 100,
            (v_provisionen->>'recruiting')::NUMERIC * (100 - v_vorschuss_anteil) / 100
        );
    END IF;

    -- 3. Provisions-Ledger verknüpfen (NUR gewählte Kategorien!)
    -- Bei Vorschuss-Abrechnung: invoice_id_vorschuss setzen
    IF v_invoice_type = 'vorschuss' AND array_length(v_kategorien, 1) > 0 THEN
        UPDATE provisions_ledger
        SET invoice_id_vorschuss = new_invoice_id
        WHERE user_id = v_user_id
          AND invoice_id_vorschuss IS NULL
          AND referenz_datum >= v_period_start
          AND referenz_datum <= v_period_end
          AND kategorie = ANY(v_kategorien);
    END IF;

    -- Bei Stornorücklage-Abrechnung: invoice_id_stornorucklage setzen
    IF v_invoice_type = 'stornorucklage' AND array_length(v_kategorien, 1) > 0 THEN
        UPDATE provisions_ledger
        SET invoice_id_stornorucklage = new_invoice_id
        WHERE user_id = v_user_id
          AND invoice_id_vorschuss IS NOT NULL  -- Muss bereits VS abgerechnet sein
          AND invoice_id_stornorucklage IS NULL
          AND referenz_datum >= v_period_start
          AND referenz_datum <= v_period_end
          AND kategorie = ANY(v_kategorien);
    END IF;

    -- 4. Euro-Ledger verknüpfen
    IF v_invoice_type = 'vorschuss' THEN
        UPDATE euro_ledger
        SET invoice_id_vorschuss = new_invoice_id
        WHERE user_id = v_user_id
          AND invoice_id_vorschuss IS NULL
          AND referenz_datum >= v_period_start
          AND referenz_datum <= v_period_end;
    END IF;

    -- 5. Invoice Items erstellen (Abzüge)
    IF COALESCE((input_data->>'stornorucklage')::NUMERIC, 0) > 0 THEN
        INSERT INTO invoice_items (invoice_id, position_type, description, quantity, unit_price, amount)
        VALUES (
            new_invoice_id,
            'stornorucklage_einbehalt',
            'Stornorücklage (' || (100 - v_vorschuss_anteil)::TEXT || '%)',
            1,
            (input_data->>'stornorucklage')::NUMERIC,
            -(input_data->>'stornorucklage')::NUMERIC
        );
    END IF;

    IF COALESCE((input_data->>'abzuegeUnterkunft')::NUMERIC, 0) > 0 THEN
        INSERT INTO invoice_items (invoice_id, position_type, description, quantity, unit_price, amount)
        VALUES (
            new_invoice_id,
            'unterkunft',
            'Unterkunftskosten',
            1,
            (input_data->>'abzuegeUnterkunft')::NUMERIC,
            -(input_data->>'abzuegeUnterkunft')::NUMERIC
        );
    END IF;

    IF COALESCE((input_data->>'abzuegeSonderposten')::NUMERIC, 0) > 0 THEN
        INSERT INTO invoice_items (invoice_id, position_type, description, quantity, unit_price, amount)
        VALUES (
            new_invoice_id,
            'sonderposten',
            'Sonderposten',
            1,
            (input_data->>'abzuegeSonderposten')::NUMERIC,
            -(input_data->>'abzuegeSonderposten')::NUMERIC
        );
    END IF;

    -- 6. Stornorücklage Tracking ENTFERNT - wird jetzt über Ledger berechnet

    -- Ergebnis zurückgeben
    SELECT row_to_json(i.*) INTO result
    FROM invoices i
    WHERE i.id = new_invoice_id;

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================
-- 4. VIEW FÜR STORNORÜCKLAGE-ÜBERSICHT
-- ============================================

-- Alte View löschen (hat andere Spaltenstruktur)
DROP VIEW IF EXISTS stornorucklage_uebersicht;

CREATE VIEW stornorucklage_uebersicht AS
SELECT
    p.user_id,
    CASE WHEN EXTRACT(MONTH FROM p.referenz_datum) <= 6 THEN 1 ELSE 2 END AS halbjahr,
    EXTRACT(YEAR FROM p.referenz_datum)::INTEGER AS year,
    SUM(p.einheiten) AS netto_einheiten,
    -- Sperrfrist = Halbjahr-Ende + 12 Monate
    CASE
        WHEN EXTRACT(MONTH FROM MIN(p.referenz_datum)) <= 6
        THEN (DATE_TRUNC('year', MIN(p.referenz_datum)) + INTERVAL '18 months')::DATE
        ELSE (DATE_TRUNC('year', MIN(p.referenz_datum)) + INTERVAL '24 months')::DATE
    END AS sperrfrist_bis,
    -- Status
    CASE
        WHEN bool_and(p.invoice_id_stornorucklage IS NOT NULL) THEN 'ausgezahlt'
        WHEN CASE
            WHEN EXTRACT(MONTH FROM MIN(p.referenz_datum)) <= 6
            THEN NOW() >= (DATE_TRUNC('year', MIN(p.referenz_datum)) + INTERVAL '18 months')
            ELSE NOW() >= (DATE_TRUNC('year', MIN(p.referenz_datum)) + INTERVAL '24 months')
        END THEN 'auszahlbar'
        ELSE 'gesperrt'
    END AS status
FROM provisions_ledger p
WHERE p.invoice_id_vorschuss IS NOT NULL  -- Nur abgerechnete Vorschüsse
GROUP BY p.user_id,
         CASE WHEN EXTRACT(MONTH FROM p.referenz_datum) <= 6 THEN 1 ELSE 2 END,
         EXTRACT(YEAR FROM p.referenz_datum)::INTEGER;

-- ============================================
-- 5. HINWEIS
-- ============================================
-- Die Tabelle stornorucklage_tracking kann später entfernt werden,
-- wenn die View stornorucklage_uebersicht vollständig genutzt wird.
-- DROP TABLE IF EXISTS public.stornorucklage_tracking;
