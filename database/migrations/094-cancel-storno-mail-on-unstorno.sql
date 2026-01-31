-- Migration 094: Bei Unstorno queued Storno-Mails canceln
-- Wenn record_status von 'storno' auf 'aktiv' wechselt,
-- werden offene Storno-Mails auf permanently_failed gesetzt

CREATE OR REPLACE FUNCTION cancel_storno_mail_on_unstorno()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.record_status = 'storno' AND NEW.record_status = 'aktiv' THEN
        UPDATE email_sends
        SET status = 'permanently_failed'
        WHERE record_id = NEW.id
          AND vorlage_typ = 'storno'
          AND status = 'queued';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cancel_storno_mail_on_unstorno
    AFTER UPDATE ON records
    FOR EACH ROW
    EXECUTE FUNCTION cancel_storno_mail_on_unstorno();
