-- ================================================================
-- MIGRATION 007: Zusätzliche Felder für Records
-- ================================================================
-- Ergänzt fehlende Spalten für vollständige Formular-Daten
-- ================================================================

DO $$
BEGIN
    -- Land
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'country') THEN
        ALTER TABLE public.records ADD COLUMN country TEXT DEFAULT 'Deutschland';
    END IF;

    -- Kontoinhaber
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'account_holder') THEN
        ALTER TABLE public.records ADD COLUMN account_holder TEXT;
    END IF;

    -- Spendenquittung gewünscht
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'donation_receipt') THEN
        ALTER TABLE public.records ADD COLUMN donation_receipt BOOLEAN DEFAULT false;
    END IF;

    -- Altes Zahlungsintervall (bei Erhöhung)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'records' AND column_name = 'old_interval') THEN
        ALTER TABLE public.records ADD COLUMN old_interval TEXT;
    END IF;

END $$;

-- ================================================================
-- FERTIG!
-- ================================================================
