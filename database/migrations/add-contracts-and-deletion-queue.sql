-- ================================================================
-- MIGRATION: Verträge und Lösch-Warteschlange
-- ================================================================
-- Für: Mitarbeiter-Verträge und sichere Löschvorgänge
-- ================================================================

-- ================================================================
-- TABELLE: user_contracts (Mitarbeiter-Verträge)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Vertragstyp
  contract_type TEXT NOT NULL CHECK (contract_type IN ('hv_vertrag', 'sonstige')),

  -- Dokumentdetails
  document_name TEXT NOT NULL,           -- Name des Dokuments (bei sonstige)
  document_url TEXT NOT NULL,            -- URL zu Supabase Storage
  original_filename TEXT,                -- Ursprünglicher Dateiname
  file_size INTEGER,                     -- Dateigröße in Bytes

  -- Zeitstempel im Dateinamen
  document_month INTEGER,                -- Monat (1-12)
  document_year INTEGER,                 -- Jahr (z.B. 2025)

  -- Status
  is_active BOOLEAN DEFAULT true,        -- Aktiv oder archiviert
  is_archived BOOLEAN DEFAULT false,     -- Vom Admin archiviert (für Nutzer unsichtbar)

  -- Metadaten
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_user_contracts_user_id ON public.user_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contracts_type ON public.user_contracts(contract_type);

-- Kommentare
COMMENT ON TABLE public.user_contracts IS 'Speichert Verträge und Vereinbarungen von Mitarbeitern';
COMMENT ON COLUMN public.user_contracts.contract_type IS 'hv_vertrag = Hauptvertrag, sonstige = Sonstige Vereinbarungen';
COMMENT ON COLUMN public.user_contracts.is_archived IS 'Vom Admin archiviert - für den Mitarbeiter nicht mehr sichtbar';

-- ================================================================
-- TABELLE: deletion_queue (Lösch-Warteschlange)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.deletion_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Was wird gelöscht?
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contract', 'document', 'profile_photo', 'other')),
  entity_id UUID NOT NULL,               -- ID des zu löschenden Elements
  entity_table TEXT NOT NULL,            -- Tabelle (z.B. 'user_contracts')

  -- Wer hat gelöscht?
  requested_by UUID REFERENCES public.users(id) NOT NULL,
  requested_by_name TEXT,                -- Name für Anzeige

  -- Betroffener Mitarbeiter
  affected_user_id UUID REFERENCES public.users(id),
  affected_user_name TEXT,               -- Name für Anzeige

  -- Details
  entity_description TEXT,               -- Beschreibung (z.B. "HV Vertrag - November 2025")
  entity_url TEXT,                       -- URL zum Dokument (falls vorhanden)

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'archived', 'rejected')),

  -- Bearbeitung
  processed_by UUID REFERENCES public.users(id),
  processed_by_name TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_note TEXT,                  -- Notiz vom Admin

  -- Zeitstempel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_deletion_queue_status ON public.deletion_queue(status);
CREATE INDEX IF NOT EXISTS idx_deletion_queue_requested_by ON public.deletion_queue(requested_by);
CREATE INDEX IF NOT EXISTS idx_deletion_queue_affected_user ON public.deletion_queue(affected_user_id);

-- Kommentare
COMMENT ON TABLE public.deletion_queue IS 'Warteschlange für Lösch-Anfragen - Admin muss bestätigen';
COMMENT ON COLUMN public.deletion_queue.status IS 'pending = wartend, approved = gelöscht, archived = archiviert, rejected = abgelehnt';

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- user_contracts: Nutzer sehen nur ihre eigenen nicht-archivierten Verträge
ALTER TABLE public.user_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own non-archived contracts"
  ON public.user_contracts FOR SELECT
  USING (
    user_id = auth.uid()
    AND is_archived = false
  );

CREATE POLICY "Users can insert own contracts"
  ON public.user_contracts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all contracts"
  ON public.user_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all contracts"
  ON public.user_contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- deletion_queue: Nur Admins sehen die Warteschlange
ALTER TABLE public.deletion_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert deletion requests"
  ON public.deletion_queue FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can view deletion queue"
  ON public.deletion_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update deletion queue"
  ON public.deletion_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ================================================================
-- FERTIG!
-- ================================================================
