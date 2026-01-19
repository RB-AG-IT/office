-- Migration: UNIQUE Constraint für euro_ledger Unterkunftskosten
-- Datum: 2026-01-19
-- Beschreibung: Verhindert doppelte Einträge für gleiche User/Kampagne/KW/Jahr/Typ-Kombination

-- Zuerst Duplikate entfernen (nur den ältesten behalten)
DELETE FROM public.euro_ledger
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, campaign_id, kategorie, kw, year, typ
                   ORDER BY created_at ASC
               ) as rn
        FROM public.euro_ledger
        WHERE kategorie = 'unterkunft' AND typ = 'abzug'
    ) sub
    WHERE rn > 1
);

-- UNIQUE Constraint hinzufügen (nur für unterkunft-abzug Kombinationen)
-- Nutzt einen partiellen UNIQUE Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_euro_ledger_unique_unterkunft
ON public.euro_ledger (user_id, campaign_id, kw, year)
WHERE kategorie = 'unterkunft' AND typ = 'abzug';
