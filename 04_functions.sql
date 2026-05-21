-- =========================================================
-- FacturaAI - Fase 1
-- Archivo: 04_functions.sql
-- Descripción: Función para registrar factura completa
-- =========================================================

CREATE OR REPLACE FUNCTION register_invoice(
    p_supplier_name VARCHAR,
    p_invoice_number VARCHAR,
    p_invoice_date DATE,
    p_currency VARCHAR,
    p_subtotal NUMERIC,
    p_taxes NUMERIC,
    p_total NUMERIC,
    p_source_file_name VARCHAR,
    p_products JSONB
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_supplier_id INT;
    v_invoice_id INT;
    v_product RECORD;
    v_product_id INT;
BEGIN
    -- Buscar proveedor existente
    SELECT supplier_id
    INTO v_supplier_id
    FROM suppliers
    WHERE LOWER(name) = LOWER(p_supplier_name);

    -- Si no existe, crearlo
    IF v_supplier_id IS NULL THEN
        INSERT INTO suppliers (name)
        VALUES (p_supplier_name)
        RETURNING supplier_id INTO v_supplier_id;
    END IF;

    -- Insertar encabezado de factura
    INSERT INTO invoices (
        supplier_id,
        invoice_number,
        invoice_date,
        currency,
        subtotal,
        taxes,
        total,
        source_file_name
    )
    VALUES (
        v_supplier_id,
        p_invoice_number,
        p_invoice_date,
        COALESCE(p_currency, 'CRC'),
        COALESCE(p_subtotal, 0),
        COALESCE(p_taxes, 0),
        COALESCE(p_total, 0),
        p_source_file_name
    )
    RETURNING invoice_id INTO v_invoice_id;

    -- Recorrer productos recibidos en JSON
    FOR v_product IN
        SELECT *
        FROM jsonb_to_recordset(p_products) AS x(
            descripcion VARCHAR,
            cantidad NUMERIC,
            unidad VARCHAR,
            precio_unitario NUMERIC,
            precio_total NUMERIC
        )
    LOOP
        -- Buscar producto existente
        SELECT product_id
        INTO v_product_id
        FROM products
        WHERE LOWER(description) = LOWER(v_product.descripcion)
          AND COALESCE(unit, '') = COALESCE(v_product.unidad, '');

        -- Si no existe, crearlo
        IF v_product_id IS NULL THEN
            INSERT INTO products (description, unit)
            VALUES (v_product.descripcion, v_product.unidad)
            RETURNING product_id INTO v_product_id;
        END IF;

        -- Insertar detalle de factura
        INSERT INTO invoice_details (
            invoice_id,
            product_id,
            quantity,
            unit_price,
            line_total
        )
        VALUES (
            v_invoice_id,
            v_product_id,
            COALESCE(v_product.cantidad, 0),
            COALESCE(v_product.precio_unitario, 0),
            COALESCE(v_product.precio_total, 0)
        );

        -- Crear o actualizar inventario
        INSERT INTO inventory (
            product_id,
            current_stock,
            last_unit_price,
            last_supplier_id,
            updated_at
        )
        VALUES (
            v_product_id,
            COALESCE(v_product.cantidad, 0),
            COALESCE(v_product.precio_unitario, 0),
            v_supplier_id,
            NOW()
        )
        ON CONFLICT (product_id)
        DO UPDATE SET
            current_stock = inventory.current_stock + EXCLUDED.current_stock,
            last_unit_price = EXCLUDED.last_unit_price,
            last_supplier_id = EXCLUDED.last_supplier_id,
            updated_at = NOW();
    END LOOP;

    RETURN v_invoice_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al registrar factura: %', SQLERRM;
END;
$$;