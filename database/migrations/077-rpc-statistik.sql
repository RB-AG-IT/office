-- RPC-Funktion für Statistik-Seite
-- Berechnet Mitglieder (aktive Records) und Netto JE pro Gruppierung

CREATE OR REPLACE FUNCTION get_record_statistics(
    p_group_by TEXT,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    group_id UUID,
    aktiv BIGINT,
    storno BIGINT,
    netto_je NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- group_by: 'customer', 'customer_area', 'campaign', 'campaign_area'

    IF p_group_by = 'customer' THEN
        RETURN QUERY
        SELECT
            r.customer_id AS group_id,
            COUNT(*) FILTER (WHERE r.record_status = 'aktiv') AS aktiv,
            COUNT(*) FILTER (WHERE r.record_status = 'storno') AS storno,
            COALESCE(SUM(
                CASE
                    WHEN r.record_status = 'aktiv' AND r.record_type = 'erhoehung'
                    THEN r.yearly_amount - COALESCE(r.old_amount, 0)
                    WHEN r.record_status = 'aktiv'
                    THEN r.yearly_amount
                    ELSE 0
                END
            ), 0) AS netto_je
        FROM records r
        WHERE r.deleted_at IS NULL
            AND r.customer_id IS NOT NULL
            AND (p_start_date IS NULL OR r.start_date >= p_start_date)
            AND (p_end_date IS NULL OR r.start_date <= p_end_date)
        GROUP BY r.customer_id;

    ELSIF p_group_by = 'customer_area' THEN
        RETURN QUERY
        SELECT
            ca.customer_area_id AS group_id,
            COUNT(*) FILTER (WHERE r.record_status = 'aktiv') AS aktiv,
            COUNT(*) FILTER (WHERE r.record_status = 'storno') AS storno,
            COALESCE(SUM(
                CASE
                    WHEN r.record_status = 'aktiv' AND r.record_type = 'erhoehung'
                    THEN r.yearly_amount - COALESCE(r.old_amount, 0)
                    WHEN r.record_status = 'aktiv'
                    THEN r.yearly_amount
                    ELSE 0
                END
            ), 0) AS netto_je
        FROM records r
        JOIN campaign_areas ca ON ca.id = r.campaign_area_id
        WHERE r.deleted_at IS NULL
            AND ca.customer_area_id IS NOT NULL
            AND (p_start_date IS NULL OR r.start_date >= p_start_date)
            AND (p_end_date IS NULL OR r.start_date <= p_end_date)
        GROUP BY ca.customer_area_id;

    ELSIF p_group_by = 'campaign' THEN
        RETURN QUERY
        SELECT
            r.campaign_id AS group_id,
            COUNT(*) FILTER (WHERE r.record_status = 'aktiv') AS aktiv,
            COUNT(*) FILTER (WHERE r.record_status = 'storno') AS storno,
            COALESCE(SUM(
                CASE
                    WHEN r.record_status = 'aktiv' AND r.record_type = 'erhoehung'
                    THEN r.yearly_amount - COALESCE(r.old_amount, 0)
                    WHEN r.record_status = 'aktiv'
                    THEN r.yearly_amount
                    ELSE 0
                END
            ), 0) AS netto_je
        FROM records r
        WHERE r.deleted_at IS NULL
            AND r.campaign_id IS NOT NULL
            AND (p_start_date IS NULL OR r.start_date >= p_start_date)
            AND (p_end_date IS NULL OR r.start_date <= p_end_date)
        GROUP BY r.campaign_id;

    ELSIF p_group_by = 'campaign_area' THEN
        RETURN QUERY
        SELECT
            r.campaign_area_id AS group_id,
            COUNT(*) FILTER (WHERE r.record_status = 'aktiv') AS aktiv,
            COUNT(*) FILTER (WHERE r.record_status = 'storno') AS storno,
            COALESCE(SUM(
                CASE
                    WHEN r.record_status = 'aktiv' AND r.record_type = 'erhoehung'
                    THEN r.yearly_amount - COALESCE(r.old_amount, 0)
                    WHEN r.record_status = 'aktiv'
                    THEN r.yearly_amount
                    ELSE 0
                END
            ), 0) AS netto_je
        FROM records r
        WHERE r.deleted_at IS NULL
            AND r.campaign_area_id IS NOT NULL
            AND (p_start_date IS NULL OR r.start_date >= p_start_date)
            AND (p_end_date IS NULL OR r.start_date <= p_end_date)
        GROUP BY r.campaign_area_id;
    END IF;
END;
$$;
