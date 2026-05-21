-- =========================================================
-- FacturaAI - Fase 1
-- Archivo: 03_views.sql
-- Descripción: Vista de inventario con semáforo
-- =========================================================

CREATE OR REPLACE VIEW vw_inventory_traffic_light AS
WITH params AS (
    SELECT
        reorder_threshold_days,
        urgent_threshold_days,
        analysis_period_days
    FROM prediction_parameters
    ORDER BY parameter_id DESC
    LIMIT 1
),
product_history AS (
    SELECT
        p.product_id,
        p.description,
        p.unit,
        COALESCE(SUM(id.quantity), 0) AS total_units_purchased,
        COUNT(DISTINCT i.invoice_id) AS invoices_registered,
        COALESCE(MAX(id.unit_price), 0) AS last_unit_price,
        MAX(s.name) AS last_supplier
    FROM products p
    LEFT JOIN invoice_details id
        ON p.product_id = id.product_id
    LEFT JOIN invoices i
        ON id.invoice_id = i.invoice_id
    LEFT JOIN suppliers s
        ON i.supplier_id = s.supplier_id
    GROUP BY
        p.product_id,
        p.description,
        p.unit
),
rotation AS (
    SELECT
        ph.product_id,
        ph.description,
        ph.unit,
        ph.total_units_purchased,
        ph.invoices_registered,
        ph.last_unit_price,
        ph.last_supplier,
        inv.current_stock,
        params.reorder_threshold_days,
        params.urgent_threshold_days,
        params.analysis_period_days,
        CASE
            WHEN params.analysis_period_days > 0
                THEN ph.total_units_purchased / params.analysis_period_days
            ELSE 0
        END AS rotation_speed
    FROM product_history ph
    INNER JOIN inventory inv
        ON ph.product_id = inv.product_id
    CROSS JOIN params
),
average_rotation AS (
    SELECT
        AVG(rotation_speed) AS avg_rotation_speed
    FROM rotation
)
SELECT
    r.product_id,
    r.description AS product,
    r.unit,
    r.last_supplier AS supplier,
    r.last_unit_price,
    r.current_stock,
    r.total_units_purchased,
    r.invoices_registered,
    ROUND(r.rotation_speed, 2) AS rotation_speed,
    CASE
        WHEN r.rotation_speed > 0
            THEN ROUND(r.current_stock / r.rotation_speed, 2)
        ELSE NULL
    END AS remaining_days,
    CASE
        WHEN r.invoices_registered <= 1
            THEN 'GRIS'
        WHEN r.rotation_speed < ar.avg_rotation_speed * 0.3
            THEN 'NEGRO'
        WHEN r.rotation_speed > 0
             AND r.current_stock / r.rotation_speed < r.urgent_threshold_days
            THEN 'ROJO'
        WHEN r.rotation_speed > 0
             AND r.current_stock / r.rotation_speed BETWEEN r.urgent_threshold_days AND r.reorder_threshold_days
            THEN 'AMARILLO'
        WHEN r.rotation_speed > 0
             AND r.current_stock / r.rotation_speed > r.reorder_threshold_days
            THEN 'VERDE'
        ELSE 'GRIS'
    END AS traffic_light_status
FROM rotation r
CROSS JOIN average_rotation ar;