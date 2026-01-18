-- Migration: RPC-Funktion für transaktionssicheres Record-Löschen
-- Erstellt Gegenbuchungen und Soft-Delete in einer Transaktion

CREATE OR REPLACE FUNCTION loesche_record_transaction(p_record_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Gegenbuchungen erstellen (negative EH für alle existierenden Ledger-Einträge)
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
        -einheiten,  -- Negativ!
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
