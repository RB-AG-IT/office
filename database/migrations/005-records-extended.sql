-- ================================================================
-- MIGRATION 005: Records Tabelle erweitern
-- ================================================================
-- Erweitert die records-Tabelle für vollständige Datensatz-Erfassung
-- mit allen Verknüpfungen und filterbaren Feldern
-- ================================================================

-- ================================================================
-- 1. NEUE SPALTEN für records
-- ================================================================

DO $$
BEGIN
    -- Datensatz-Typ (Neumitglied / Erhöhung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'record_type') THEN
        ALTER TABLE public.records ADD COLUMN record_type TEXT CHECK (record_type IN ('neumitglied', 'erhoehung'));
    END IF;

    -- Datensatz-Status (Aktiv / Storno)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'record_status') THEN
        ALTER TABLE public.records ADD COLUMN record_status TEXT DEFAULT 'aktiv' CHECK (record_status IN ('aktiv', 'storno'));
    END IF;

    -- Kalenderwoche
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'kw') THEN
        ALTER TABLE public.records ADD COLUMN kw INTEGER CHECK (kw >= 1 AND kw <= 53);
    END IF;

    -- Jahr
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'year') THEN
        ALTER TABLE public.records ADD COLUMN year INTEGER;
    END IF;

    -- ================================================================
    -- Verknüpfungen
    -- ================================================================

    -- Teamchef (aus Kampagne/KW, anpassbar)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'teamchef_id') THEN
        ALTER TABLE public.records ADD COLUMN teamchef_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- Quality Manager (aus Kampagne/KW, anpassbar)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'quality_id') THEN
        ALTER TABLE public.records ADD COLUMN quality_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- Kunde (aus Werbegebiet)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'customer_id') THEN
        ALTER TABLE public.records ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;

    -- Werbegebiet (campaign_area statt werbegebiete)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'campaign_area_id') THEN
        ALTER TABLE public.records ADD COLUMN campaign_area_id UUID REFERENCES public.campaign_areas(id) ON DELETE SET NULL;
    END IF;

    -- ================================================================
    -- Persönliche Daten (filterbar)
    -- ================================================================

    -- Anrede
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'salutation') THEN
        ALTER TABLE public.records ADD COLUMN salutation TEXT;
    END IF;

    -- Titel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'title') THEN
        ALTER TABLE public.records ADD COLUMN title TEXT;
    END IF;

    -- Vorname
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'first_name') THEN
        ALTER TABLE public.records ADD COLUMN first_name TEXT;
    END IF;

    -- Nachname
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'last_name') THEN
        ALTER TABLE public.records ADD COLUMN last_name TEXT;
    END IF;

    -- Firma
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'company') THEN
        ALTER TABLE public.records ADD COLUMN company TEXT;
    END IF;

    -- Geburtsdatum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'birth_date') THEN
        ALTER TABLE public.records ADD COLUMN birth_date DATE;
    END IF;

    -- E-Mail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'email') THEN
        ALTER TABLE public.records ADD COLUMN email TEXT;
    END IF;

    -- Telefon Festnetz
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'phone_fixed') THEN
        ALTER TABLE public.records ADD COLUMN phone_fixed TEXT;
    END IF;

    -- Telefon Mobil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'phone_mobile') THEN
        ALTER TABLE public.records ADD COLUMN phone_mobile TEXT;
    END IF;

    -- ================================================================
    -- Adresse
    -- ================================================================

    -- Straße
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'street') THEN
        ALTER TABLE public.records ADD COLUMN street TEXT;
    END IF;

    -- Hausnummer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'house_number') THEN
        ALTER TABLE public.records ADD COLUMN house_number TEXT;
    END IF;

    -- PLZ
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'zip_code') THEN
        ALTER TABLE public.records ADD COLUMN zip_code TEXT;
    END IF;

    -- Stadt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'city') THEN
        ALTER TABLE public.records ADD COLUMN city TEXT;
    END IF;

    -- ================================================================
    -- Zahlungsdaten
    -- ================================================================

    -- IBAN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'iban') THEN
        ALTER TABLE public.records ADD COLUMN iban TEXT;
    END IF;

    -- BIC
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'bic') THEN
        ALTER TABLE public.records ADD COLUMN bic TEXT;
    END IF;

    -- Bank Name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'bank_name') THEN
        ALTER TABLE public.records ADD COLUMN bank_name TEXT;
    END IF;

    -- Zahlungsmethode (lastschrift / überweisung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'payment_method') THEN
        ALTER TABLE public.records ADD COLUMN payment_method TEXT;
    END IF;

    -- ================================================================
    -- Beiträge
    -- ================================================================

    -- Betrag (pro Intervall)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'amount') THEN
        ALTER TABLE public.records ADD COLUMN amount DECIMAL(10,2);
    END IF;

    -- Jahresbetrag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'yearly_amount') THEN
        ALTER TABLE public.records ADD COLUMN yearly_amount DECIMAL(10,2);
    END IF;

    -- Intervall (monthly, quarterly, halfyearly, yearly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'interval') THEN
        ALTER TABLE public.records ADD COLUMN interval TEXT;
    END IF;

    -- Alter Betrag (bei Erhöhung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'old_amount') THEN
        ALTER TABLE public.records ADD COLUMN old_amount DECIMAL(10,2);
    END IF;

    -- Erhöhungsbetrag (Differenz)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'increase_amount') THEN
        ALTER TABLE public.records ADD COLUMN increase_amount DECIMAL(10,2);
    END IF;

    -- ================================================================
    -- Erhöhungs-spezifisch
    -- ================================================================

    -- Mitgliedsnummer (bei Erhöhung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'member_number') THEN
        ALTER TABLE public.records ADD COLUMN member_number TEXT;
    END IF;

    -- Mitglied seit (bei Erhöhung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'member_since') THEN
        ALTER TABLE public.records ADD COLUMN member_since DATE;
    END IF;

    -- Startdatum (späterer Start)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'start_date') THEN
        ALTER TABLE public.records ADD COLUMN start_date DATE;
    END IF;

    -- ================================================================
    -- Einwilligungen
    -- ================================================================

    -- Datenschutz-Einwilligung
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'consent_privacy') THEN
        ALTER TABLE public.records ADD COLUMN consent_privacy BOOLEAN DEFAULT false;
    END IF;

    -- SEPA-Einwilligung
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'consent_sepa') THEN
        ALTER TABLE public.records ADD COLUMN consent_sepa BOOLEAN DEFAULT false;
    END IF;

    -- Satzung-Einwilligung
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'consent_statutes') THEN
        ALTER TABLE public.records ADD COLUMN consent_statutes BOOLEAN DEFAULT false;
    END IF;

    -- Kontakt per E-Mail erlaubt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'contact_email') THEN
        ALTER TABLE public.records ADD COLUMN contact_email BOOLEAN DEFAULT false;
    END IF;

    -- Kontakt per Telefon erlaubt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'contact_phone') THEN
        ALTER TABLE public.records ADD COLUMN contact_phone BOOLEAN DEFAULT false;
    END IF;

    -- ================================================================
    -- Sonstiges
    -- ================================================================

    -- Notizen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'notes') THEN
        ALTER TABLE public.records ADD COLUMN notes TEXT;
    END IF;

    -- Unterschrift (Base64 oder URL)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'signature') THEN
        ALTER TABLE public.records ADD COLUMN signature TEXT;
    END IF;

    -- Storno-Datum
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'storno_date') THEN
        ALTER TABLE public.records ADD COLUMN storno_date DATE;
    END IF;

    -- Storno-Grund
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'storno_reason') THEN
        ALTER TABLE public.records ADD COLUMN storno_reason TEXT;
    END IF;

END $$;


-- ================================================================
-- 2. INDIZES für Filterung
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_records_type ON public.records(record_type);
CREATE INDEX IF NOT EXISTS idx_records_record_status ON public.records(record_status);
CREATE INDEX IF NOT EXISTS idx_records_kw ON public.records(kw);
CREATE INDEX IF NOT EXISTS idx_records_year ON public.records(year);
CREATE INDEX IF NOT EXISTS idx_records_teamchef ON public.records(teamchef_id);
CREATE INDEX IF NOT EXISTS idx_records_quality ON public.records(quality_id);
CREATE INDEX IF NOT EXISTS idx_records_customer ON public.records(customer_id);
CREATE INDEX IF NOT EXISTS idx_records_campaign_area ON public.records(campaign_area_id);
CREATE INDEX IF NOT EXISTS idx_records_last_name ON public.records(last_name);
CREATE INDEX IF NOT EXISTS idx_records_zip_code ON public.records(zip_code);
CREATE INDEX IF NOT EXISTS idx_records_yearly_amount ON public.records(yearly_amount);


-- ================================================================
-- FERTIG!
-- ================================================================
