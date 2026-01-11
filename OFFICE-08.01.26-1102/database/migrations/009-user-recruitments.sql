-- Migration: User Recruitments Tabelle
-- Speichert Recruiting- und Empfehlungs-Beziehungen zwischen Usern

CREATE TABLE IF NOT EXISTS public.user_recruitments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,           -- Der geworbene User
  recruited_by_id uuid NOT NULL,   -- Wer hat geworben
  recruitment_type text NOT NULL CHECK (recruitment_type IN ('recruiting', 'empfehlung')),
  recruitment_date date,
  campaign_id uuid,                -- Bei welcher Kampagne geworben
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_recruitments_pkey PRIMARY KEY (id),
  CONSTRAINT user_recruitments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_recruitments_recruited_by_id_fkey FOREIGN KEY (recruited_by_id) REFERENCES public.users(id),
  CONSTRAINT user_recruitments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);

-- Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_recruitments_user ON public.user_recruitments(user_id);
CREATE INDEX IF NOT EXISTS idx_recruitments_recruited_by ON public.user_recruitments(recruited_by_id);
CREATE INDEX IF NOT EXISTS idx_recruitments_type ON public.user_recruitments(recruitment_type);
CREATE INDEX IF NOT EXISTS idx_recruitments_date ON public.user_recruitments(recruitment_date);

-- RLS aktivieren
ALTER TABLE public.user_recruitments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all recruitments" ON public.user_recruitments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert recruitments" ON public.user_recruitments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update recruitments" ON public.user_recruitments
  FOR UPDATE USING (auth.role() = 'authenticated');
