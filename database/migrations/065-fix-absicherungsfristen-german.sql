-- Migration 065: Absicherungsfristen auf deutsche Werte umstellen
-- Grund: records.interval enthält deutsche Werte (Monatlich, etc.)

-- 1. Bestehende Daten löschen
DELETE FROM absicherungsfristen;

-- 2. CHECK constraint ändern
ALTER TABLE absicherungsfristen
DROP CONSTRAINT IF EXISTS absicherungsfristen_zahlungsart_check;

ALTER TABLE absicherungsfristen
ADD CONSTRAINT absicherungsfristen_zahlungsart_check
CHECK (zahlungsart IN ('Monatlich', 'Vierteljährlich', 'Halbjährlich', 'Jährlich'));

-- 3. Neue deutsche Werte einfügen
INSERT INTO absicherungsfristen (zahlungsart, monate_vj_1_2, monate_vj_3, monate_vj_4, monate_vj_5) VALUES
('Monatlich', 13, 25, 37, 49),
('Vierteljährlich', 27, 39, 51, 63),
('Halbjährlich', 30, 42, 54, 66),
('Jährlich', 24, 36, 48, 60);

-- Kommentar aktualisieren
COMMENT ON COLUMN absicherungsfristen.zahlungsart IS 'Monatlich, Vierteljährlich, Halbjährlich, Jährlich';
