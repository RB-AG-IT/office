-- ================================================================
-- MIGRATION 008: User Settings Tabelle
-- ================================================================
-- Speichert benutzerspezifische Einstellungen wie Spalten-Vorlagen
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint: Ein User kann pro Key nur einen Eintrag haben
    UNIQUE(user_id, setting_key)
);

-- Index für schnellen Zugriff
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON public.user_settings(setting_key);

-- RLS aktivieren
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: User kann nur eigene Settings lesen/schreiben
CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- ================================================================
-- FERTIG!
-- ================================================================
