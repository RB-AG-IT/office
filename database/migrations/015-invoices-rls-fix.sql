-- Migration: 015-invoices-rls-fix.sql
-- Fügt fehlende INSERT/UPDATE Policies für invoices und invoice_items hinzu

-- ============================================
-- INVOICES - INSERT Policy für authentifizierte User
-- ============================================
CREATE POLICY "Authenticated users can insert invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (true);

-- INVOICES - UPDATE Policy für authentifizierte User
CREATE POLICY "Authenticated users can update invoices"
    ON public.invoices FOR UPDATE
    USING (true);

-- ============================================
-- INVOICE_ITEMS - INSERT Policy
-- ============================================
CREATE POLICY "Authenticated users can insert invoice_items"
    ON public.invoice_items FOR INSERT
    WITH CHECK (true);
