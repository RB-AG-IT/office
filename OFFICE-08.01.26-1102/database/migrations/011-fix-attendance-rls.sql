-- ================================================================
-- FIX: RLS Policy für campaign_attendance
-- Erlaubt allen authentifizierten Benutzern das Schreiben
-- ================================================================

-- Policy für INSERT (alle authentifizierten User)
CREATE POLICY "Authenticated users can insert attendance"
    ON public.campaign_attendance
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy für UPDATE (alle authentifizierten User)
CREATE POLICY "Authenticated users can update attendance"
    ON public.campaign_attendance
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Dasselbe für campaign_attendance_notes
CREATE POLICY "Authenticated users can insert attendance_notes"
    ON public.campaign_attendance_notes
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update attendance_notes"
    ON public.campaign_attendance_notes
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);
