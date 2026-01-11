-- E-Mail Vorlagen Tabelle
-- Speichert die Vorlagen für automatische E-Mails

CREATE TABLE IF NOT EXISTS email_vorlagen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vorlage-Typ (eindeutig pro Typ)
    vorlage_typ VARCHAR(50) NOT NULL UNIQUE,
    -- Mögliche Typen: 'willkommen', 'erhoehung', 'iban_nachtrag', 'storno'

    -- E-Mail Inhalt
    betreff VARCHAR(255) NOT NULL,
    inhalt TEXT NOT NULL,

    -- Metadaten
    aktiv BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Vorlage für Willkommensmail einfügen
INSERT INTO email_vorlagen (vorlage_typ, betreff, inhalt, aktiv)
VALUES (
    'willkommen',
    'Herzlich willkommen als Fördermitglied',
    '{{anrede}} {{vorname}} {{nachname}},

vielen Dank für Ihre Unterstützung!

Sie haben sich entschieden, uns mit {{betrag}} € {{intervall}} zu unterstützen.

Mit Ihrer Fördermitgliedschaft helfen Sie uns, Menschen in Not zu helfen und unsere wichtige Arbeit fortzusetzen.

Ihre Daten werden gemäß unserer Datenschutzerklärung vertraulich behandelt.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr DRK-Team',
    true
)
ON CONFLICT (vorlage_typ) DO NOTHING;

-- RLS aktivieren
ALTER TABLE email_vorlagen ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann lesen (für Formular)
CREATE POLICY "email_vorlagen_select" ON email_vorlagen
    FOR SELECT USING (true);

-- Policy: Nur Service-Role kann schreiben
CREATE POLICY "email_vorlagen_insert" ON email_vorlagen
    FOR INSERT WITH CHECK (true);

CREATE POLICY "email_vorlagen_update" ON email_vorlagen
    FOR UPDATE USING (true);

-- Index für schnellen Zugriff
CREATE INDEX IF NOT EXISTS idx_email_vorlagen_typ ON email_vorlagen(vorlage_typ);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_email_vorlagen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_vorlagen_updated_at ON email_vorlagen;
CREATE TRIGGER email_vorlagen_updated_at
    BEFORE UPDATE ON email_vorlagen
    FOR EACH ROW
    EXECUTE FUNCTION update_email_vorlagen_updated_at();
