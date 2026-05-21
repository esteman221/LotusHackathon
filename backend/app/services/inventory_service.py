from app.db.connection import get_connection


def get_inventory_items() -> list[dict]:
    query = """
        SELECT
            p.product_id,
            p.description AS product,
            p.unit,
            i.current_stock,
            i.last_unit_price,
            s.name AS last_supplier,
            i.updated_at
        FROM inventory i
        INNER JOIN products p
            ON i.product_id = p.product_id
        LEFT JOIN suppliers s
            ON i.last_supplier_id = s.supplier_id
        ORDER BY p.description;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()


def get_inventory_traffic_light() -> list[dict]:
    query = """
        SELECT
            product_id,
            product,
            unit,
            supplier,
            last_unit_price,
            current_stock,
            total_units_purchased,
            invoices_registered,
            rotation_speed,
            remaining_days,
            traffic_light_status
        FROM vw_inventory_traffic_light
        ORDER BY
            CASE traffic_light_status
                WHEN 'ROJO' THEN 1
                WHEN 'AMARILLO' THEN 2
                WHEN 'NEGRO' THEN 3
                WHEN 'GRIS' THEN 4
                WHEN 'VERDE' THEN 5
                ELSE 6
            END,
            remaining_days ASC NULLS LAST;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            return cur.fetchall()