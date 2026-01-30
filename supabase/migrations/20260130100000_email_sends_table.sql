-- ================================================================
-- MIGRATION: email_sends Tabelle
-- Zentrale Tabelle für alle Email-Versände (willkommen, storno, iban, etc.)
-- ================================================================

CREATE TABLE IF NOT EXISTS email_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES records(id) ON DELETE CASCADE,
    vorlage_typ TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent', 'failed', 'permanently_failed', 'skipped')),
    sent_at TIMESTAMPTZ,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    tracking_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zusammengesetzter Index für Doppelversand-Schutz + Lookups
CREATE INDEX IF NOT EXISTS idx_email_sends_record_typ ON email_sends(record_id, vorlage_typ);
-- Index für Cron-Abfrage
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status, vorlage_typ);
-- Index für Tracking-Pixel
CREATE INDEX IF NOT EXISTS idx_email_sends_tracking ON email_sends(tracking_id);

-- RLS
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_sends_select" ON email_sends FOR SELECT USING (true);
CREATE POLICY "email_sends_insert" ON email_sends FOR INSERT WITH CHECK (true);
CREATE POLICY "email_sends_update" ON email_sends FOR UPDATE USING (true);
