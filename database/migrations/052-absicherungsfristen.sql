-- Migration 052: Absicherungsfristen (Konstanten für DRK-Folgevergütung)
-- Die Fristen bestimmen, ab wann ein Vergütungsjahr "abgesichert" ist
-- (bei Storno keine Rückzahlung mehr erforderlich)

CREATE TABLE IF NOT EXISTS absicherungsfristen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zahlungsart TEXT NOT NULL UNIQUE CHECK (zahlungsart IN ('monthly', 'quarterly', 'biannual', 'annual')),
    monate_vj_1_2 INTEGER NOT NULL,  -- Monate bis VJ 1+2 abgesichert
    monate_vj_3 INTEGER NOT NULL,    -- Monate bis VJ 3 abgesichert
    monate_vj_4 INTEGER NOT NULL,    -- Monate bis VJ 4 abgesichert
    monate_vj_5 INTEGER NOT NULL,    -- Monate bis VJ 5 abgesichert
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Kommentare
COMMENT ON TABLE absicherungsfristen IS 'Konstanten für Absicherungsfristen nach Zahlungsart (DRK-Folgevergütung)';
COMMENT ON COLUMN absicherungsfristen.zahlungsart IS 'monthly=monatlich, quarterly=quartalsweise, biannual=halbjährlich, annual=jährlich';
COMMENT ON COLUMN absicherungsfristen.monate_vj_1_2 IS 'Monate ab Record-Start bis VJ 1+2 abgesichert sind';

-- Feste Konstanten einfügen
INSERT INTO absicherungsfristen (zahlungsart, monate_vj_1_2, monate_vj_3, monate_vj_4, monate_vj_5) VALUES
('monthly', 13, 25, 37, 49),      -- Monatlich: 13, +12 pro Jahr
('quarterly', 27, 39, 51, 63),    -- Quartalsweise: 9Q, +4Q pro Jahr (×3 Monate)
('biannual', 30, 42, 54, 66),     -- Halbjährlich: 5HJ, +2HJ pro Jahr (×6 Monate)
('annual', 24, 36, 48, 60)        -- Jährlich: 2J, +1J pro Jahr (×12 Monate)
ON CONFLICT (zahlungsart) DO NOTHING;

-- RLS wird am Ende des Projekts aktiviert
