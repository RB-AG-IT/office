-- Migration: Bestandsmitglieder-Tabelle für ERH-Prefill
-- Speichert Bestandsmitgliederlisten pro Werbegebiet (customer_area)

CREATE TABLE IF NOT EXISTS bestandsmitglieder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Zuordnung zu Werbegebiet des Kunden (dauerhaft, kampagnenübergreifend)
    customer_area_id UUID NOT NULL REFERENCES customer_areas(id) ON DELETE CASCADE,

    -- Pflichtfelder
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    old_amount DECIMAL(10,2) NOT NULL,

    -- Optionale Felder (Prefill)
    member_number VARCHAR,
    member_since DATE,
    old_interval VARCHAR,
    salutation VARCHAR,
    title VARCHAR,
    birth_date DATE,
    street VARCHAR,
    house_number VARCHAR,
    zip_code VARCHAR,
    city VARCHAR,
    country VARCHAR DEFAULT 'Deutschland',
    email VARCHAR,
    phone_fixed VARCHAR,
    phone_mobile VARCHAR,
    iban VARCHAR,
    bic VARCHAR,
    bank_name VARCHAR,
    account_holder VARCHAR,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_bestandsmitglieder_area ON bestandsmitglieder(customer_area_id);
CREATE INDEX IF NOT EXISTS idx_bestandsmitglieder_name ON bestandsmitglieder(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_bestandsmitglieder_member_number ON bestandsmitglieder(member_number);

-- Row Level Security
ALTER TABLE bestandsmitglieder ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten Benutzer haben Zugriff
CREATE POLICY "Allow all for authenticated" ON bestandsmitglieder
    FOR ALL
    USING (true);

-- Trigger für updated_at
CREATE TRIGGER update_bestandsmitglieder_updated_at
    BEFORE UPDATE ON bestandsmitglieder
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
