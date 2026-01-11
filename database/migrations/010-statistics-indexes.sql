-- Migration: Indizes für Statistik/Achievements Berechnung
-- Optimiert Queries für Live-Berechnung von Achievements und Statistiken

-- Records: Indizes für Filterung und Aggregation
CREATE INDEX IF NOT EXISTS idx_records_werber_id ON public.records(werber_id);
CREATE INDEX IF NOT EXISTS idx_records_campaign_id ON public.records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_records_customer_id ON public.records(customer_id);
CREATE INDEX IF NOT EXISTS idx_records_campaign_area_id ON public.records(campaign_area_id);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON public.records(created_at);
CREATE INDEX IF NOT EXISTS idx_records_start_date ON public.records(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_records_record_status ON public.records(record_status);
CREATE INDEX IF NOT EXISTS idx_records_record_type ON public.records(record_type);
CREATE INDEX IF NOT EXISTS idx_records_kw ON public.records(kw);
CREATE INDEX IF NOT EXISTS idx_records_year ON public.records(year);

-- Kombinierte Indizes für häufige Queries
CREATE INDEX IF NOT EXISTS idx_records_werber_status ON public.records(werber_id, record_status);
CREATE INDEX IF NOT EXISTS idx_records_campaign_status ON public.records(campaign_id, record_status);
CREATE INDEX IF NOT EXISTS idx_records_year_kw ON public.records(year, kw);
CREATE INDEX IF NOT EXISTS idx_records_werber_year ON public.records(werber_id, year);

-- Records: Index für Achievements (Sortierung nach yearly_amount)
CREATE INDEX IF NOT EXISTS idx_records_yearly_amount ON public.records(yearly_amount DESC);

-- Campaign Attendance: Indizes für Einsatztage-Berechnung
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.campaign_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_campaign_id ON public.campaign_attendance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attendance_kw ON public.campaign_attendance(kw);

-- Rankings: Indizes für Ranglisten
CREATE INDEX IF NOT EXISTS idx_rankings_user_period ON public.rankings(user_id, period);
CREATE INDEX IF NOT EXISTS idx_rankings_period_start ON public.rankings(period_start);
