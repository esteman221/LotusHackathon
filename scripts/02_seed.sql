-- =========================================================
-- FacturaAI - Fase 1
-- Archivo: 02_seed.sql
-- Descripción: Datos demo para pruebas
-- =========================================================

-- =========================
-- PROVEEDORES
-- =========================

INSERT INTO suppliers (name, country, email, phone)
VALUES
('Distribuidora El Sol', 'Costa Rica', 'ventas@elsol.com', '+506 2222-1111'),
('Proveedor Norte', 'Costa Rica', 'contacto@proveedornorte.com', '+506 2222-2222')
ON CONFLICT (name) DO NOTHING;

-- =========================
-- PRODUCTOS
-- =========================

INSERT INTO products (description, unit)
VALUES
('Arroz grano largo 1kg', 'unidad'),
('Aceite vegetal 1L', 'unidad'),
('Azúcar blanca 1kg', 'unidad'),
('Frijoles negros 500g', 'unidad')
ON CONFLICT (description, unit) DO NOTHING;

-- =========================
-- FACTURAS
-- =========================

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
VALUES
(
    (SELECT supplier_id FROM suppliers WHERE name = 'Distribuidora El Sol'),
    'FAC-001',
    '2025-01-01',
    'CRC',
    150000,
    19500,
    169500,
    'demo_factura_1.pdf'
),
(
    (SELECT supplier_id FROM suppliers WHERE name = 'Proveedor Norte'),
    'FAC-002',
    '2025-01-01',
    'CRC',
    160000,
    20800,
    180800,
    'demo_factura_2.pdf'
);

-- =========================
-- DETALLE DE FACTURAS
-- =========================

INSERT INTO invoice_details (
    invoice_id,
    product_id,
    quantity,
    unit_price,
    line_total
)
VALUES
(
    (SELECT invoice_id FROM invoices WHERE invoice_number = 'FAC-001'),
    (SELECT product_id FROM products WHERE description = 'Arroz grano largo 1kg'),
    120,
    850,
    102000
),
(
    (SELECT invoice_id FROM invoices WHERE invoice_number = 'FAC-001'),
    (SELECT product_id FROM products WHERE description = 'Aceite vegetal 1L'),
    40,
    1200,
    48000
),
(
    (SELECT invoice_id FROM invoices WHERE invoice_number = 'FAC-002'),
    (SELECT product_id FROM products WHERE description = 'Azúcar blanca 1kg'),
    200,
    720,
    144000
),
(
    (SELECT invoice_id FROM invoices WHERE invoice_number = 'FAC-002'),
    (SELECT product_id FROM products WHERE description = 'Frijoles negros 500g'),
    15,
    950,
    14250
);

-- =========================
-- INVENTARIO
-- =========================

INSERT INTO inventory (
    product_id,
    current_stock,
    last_unit_price,
    last_supplier_id
)
VALUES
(
    (SELECT product_id FROM products WHERE description = 'Arroz grano largo 1kg'),
    100,
    850,
    (SELECT supplier_id FROM suppliers WHERE name = 'Distribuidora El Sol')
),
(
    (SELECT product_id FROM products WHERE description = 'Aceite vegetal 1L'),
    100,
    1200,
    (SELECT supplier_id FROM suppliers WHERE name = 'Distribuidora El Sol')
),
(
    (SELECT product_id FROM products WHERE description = 'Azúcar blanca 1kg'),
    100,
    720,
    (SELECT supplier_id FROM suppliers WHERE name = 'Proveedor Norte')
),
(
    (SELECT product_id FROM products WHERE description = 'Frijoles negros 500g'),
    100,
    950,
    (SELECT supplier_id FROM suppliers WHERE name = 'Proveedor Norte')
)
ON CONFLICT (product_id) DO NOTHING;

-- =========================
-- PARÁMETROS DE PREDICCIÓN
-- =========================

INSERT INTO prediction_parameters (
    reorder_threshold_days,
    urgent_threshold_days,
    analysis_period_days,
    initial_stock
)
VALUES
(14, 7, 30, 100);