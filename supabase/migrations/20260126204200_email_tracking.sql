-- ================================================================
-- MIGRATION 080: Email-Tracking Felder
-- ================================================================

-- 1. Neue Felder in records
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_status TEXT
    DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'queued', 'sent', 'failed', 'bounced', 'skipped'));

ALTER TABLE records ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ;
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_error TEXT;
ALTER TABLE records ADD COLUMN IF NOT EXISTS email_tracking_id UUID DEFAULT gen_random_uuid();

-- 2. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_records_email_status ON records(email_status);
CREATE INDEX IF NOT EXISTS idx_records_email_tracking_id ON records(email_tracking_id);

-- 3. Email-Log Tabelle
CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES records(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('queued', 'sent', 'opened', 'bounced', 'failed')),
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_record ON email_log(record_id);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(event_type);

-- 4. RLS für email_log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_log_select" ON email_log FOR SELECT USING (true);
CREATE POLICY "email_log_insert" ON email_log FOR INSERT WITH CHECK (true);

-- 5. Trigger für email_status bei INSERT
-- (email_vorlagen Tabelle existiert bereits)
CREATE OR REPLACE FUNCTION set_email_status_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur für Neumitglieder mit Email
    IF NEW.record_type = 'neumitglied' AND NEW.email IS NOT NULL AND NEW.email != '' THEN
        NEW.email_status := 'queued';
    ELSE
        NEW.email_status := 'skipped';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_record_insert_set_email_status ON records;
CREATE TRIGGER on_record_insert_set_email_status
    BEFORE INSERT ON records
    FOR EACH ROW
    EXECUTE FUNCTION set_email_status_on_insert();
