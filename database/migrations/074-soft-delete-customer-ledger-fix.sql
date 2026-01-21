-- Migration 074: Soft-Delete Funktion erweitern für customer_billing_ledger
-- Problem: loesche_record_transaction erstellt nur Gegenbuchungen in provisions_ledger,
--          aber nicht in customer_billing_ledger (im Gegensatz zu Storno/Hard-Delete)

CREATE OR REPLACE FUNCTION loesche_record_transaction(p_record_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- ========== PROVISIONS_LEDGER: Gegenbuchungen ==========
    INSERT INTO provisions_ledger (
        user_id,
        record_id,
        kategorie,
        typ,
        einheiten,
        kw,
        year,
        referenz_datum,
        beschreibung,
        campaign_id,
        campaign_area_id,
        customer_id
    )
    SELECT
        user_id,
        record_id,
        kategorie,
        'loeschung',
        -einheiten,
        kw,
        year,
        CURRENT_DATE,
        'Löschung: ' || COALESCE(beschreibung, ''),
        campaign_id,
        campaign_area_id,
        customer_id
    FROM provisions_ledger
    WHERE record_id = p_record_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- ========== CUSTOMER_BILLING_LEDGER: Gegenbuchungen ==========
    INSERT INTO customer_billing_ledger (
        customer_id,
        record_id,
        typ,
        jahreseuros,
        kw,
        year,
        referenz_datum,
        beschreibung,
        campaign_id,
        campaign_area_id,
        werber_id,
        verguetungsjahr,
        entitlement_id
    )
    SELECT
        customer_id,
        record_id,
        'loeschung',
        -jahreseuros,
        kw,
        year,
        CURRENT_DATE,
        'Löschung: ' || COALESCE(beschreibung, ''),
        campaign_id,
        campaign_area_id,
        werber_id,
        verguetungsjahr,
        entitlement_id
    FROM customer_billing_ledger
    WHERE record_id = p_record_id;

    -- Record soft-deleten
    UPDATE records
    SET deleted_at = NOW()
    WHERE id = p_record_id;

    RETURN TRUE;
END;
$$;

-- Berechtigung für authenticated users
GRANT EXECUTE ON FUNCTION loesche_record_transaction(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION loesche_record_transaction(UUID) TO service_role;
