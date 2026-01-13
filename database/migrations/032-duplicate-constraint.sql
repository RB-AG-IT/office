-- Migration 032: Unique-Constraint für records-Tabelle
-- Verhindert doppelte Datensätze bei Timeout/Retry-Situationen
--
-- Szenario: User sendet Formular ab, Timeout tritt auf, User sendet nochmal
-- → Der erste Request kam trotzdem an → Duplikat
-- Dieser Constraint verhindert das auf DB-Ebene.

-- Unique-Constraint auf Kombination von Identifikationsfeldern
-- NULLS NOT DISTINCT: Behandelt NULL-Werte als gleich (PostgreSQL 15+)
ALTER TABLE records
ADD CONSTRAINT records_unique_person
UNIQUE NULLS NOT DISTINCT (first_name, last_name, birth_date, iban);

-- Hinweis: Bei Constraint-Verletzung gibt PostgreSQL Fehlercode 23505 zurück
-- Das Frontend sollte diesen Fehler abfangen und eine freundliche Meldung zeigen
