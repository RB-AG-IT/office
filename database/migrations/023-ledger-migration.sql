-- ============================================================================
-- Migration 023: Bestandsdaten in Ledger migrieren
-- ============================================================================
-- Migriert alle bestehenden aktiven Records in die neuen Ledger-Tabellen
-- ============================================================================

-- ============================================================================
-- 1. WERBER-LEDGER: Bestandsdaten
-- ============================================================================

-- Werben-Provision
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    werber_id,
    id,
    'werben',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND werber_id IS NOT NULL;

-- Teamleitung-Provision
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    teamchef_id,
    id,
    'teamleitung',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND teamchef_id IS NOT NULL;

-- Quality-Provision
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    quality_id,
    id,
    'quality',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND quality_id IS NOT NULL;

-- Empfehlung-Provision
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    empfehlung_id,
    id,
    'empfehlung',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND empfehlung_id IS NOT NULL;

-- Recruiting-Provision
INSERT INTO provisions_ledger (user_id, record_id, kategorie, typ, einheiten, kw, year, referenz_datum, beschreibung)
SELECT
    recruiting_id,
    id,
    'recruiting',
    'provision',
    COALESCE(yearly_amount, 0) / 12,
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND recruiting_id IS NOT NULL;

-- ============================================================================
-- 2. KUNDEN-LEDGER: Bestandsdaten
-- ============================================================================

INSERT INTO customer_billing_ledger (customer_id, record_id, typ, jahreseuros, kw, year, referenz_datum, beschreibung)
SELECT
    customer_id,
    id,
    'provision',
    COALESCE(yearly_amount, 0),
    kw,
    year,
    COALESCE(start_date, created_at::date),
    'Migration: Bestandsdaten'
FROM records
WHERE record_status = 'aktiv'
AND customer_id IS NOT NULL;

-- ============================================================================
-- 3. PRÜF-QUERIES (zur Verifizierung ausführen)
-- ============================================================================

-- Anzahl migrierter Einträge
-- SELECT 'provisions_ledger' as tabelle, COUNT(*) as anzahl FROM provisions_ledger WHERE beschreibung = 'Migration: Bestandsdaten'
-- UNION ALL
-- SELECT 'customer_billing_ledger', COUNT(*) FROM customer_billing_ledger WHERE beschreibung = 'Migration: Bestandsdaten';

-- Summe Einheiten pro Kategorie
-- SELECT kategorie, SUM(einheiten) as total_eh FROM provisions_ledger GROUP BY kategorie;

-- Summe Jahreseuros pro Kunde
-- SELECT c.name, SUM(cbl.jahreseuros) as total_je
-- FROM customer_billing_ledger cbl
-- JOIN customers c ON c.id = cbl.customer_id
-- GROUP BY c.name;

-- ============================================================================
-- MIGRATION ABGESCHLOSSEN
-- ============================================================================
