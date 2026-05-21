-- =========================================================
-- FacturaAI - Fase 1
-- Archivo: 01_schema.sql
-- Descripción: Creación de tablas principales
-- =========================================================

DROP TABLE IF EXISTS invoice_details CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS prediction_parameters CASCADE;

-- =========================
-- TABLA: suppliers
-- =========================

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    country VARCHAR(80),
    email VARCHAR(120),
    phone VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_suppliers_name
        UNIQUE (name)
);

-- =========================
-- TABLA: products
-- =========================

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_products_description_unit
        UNIQUE (description, unit)
);

-- =========================
-- TABLA: invoices
-- =========================

CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    invoice_number VARCHAR(80),
    invoice_date DATE,
    currency VARCHAR(10) DEFAULT 'CRC',
    subtotal NUMERIC(18,2) DEFAULT 0 CHECK (subtotal >= 0),
    taxes NUMERIC(18,2) DEFAULT 0 CHECK (taxes >= 0),
    total NUMERIC(18,2) DEFAULT 0 CHECK (total >= 0),
    source_file_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_invoices_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================
-- TABLA: invoice_details
-- =========================

CREATE TABLE invoice_details (
    detail_id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity NUMERIC(18,2) NOT NULL CHECK (quantity >= 0),
    unit_price NUMERIC(18,2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(18,2) DEFAULT 0 CHECK (line_total >= 0),

    CONSTRAINT fk_invoice_details_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_invoice_details_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================
-- TABLA: inventory
-- =========================

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    current_stock NUMERIC(18,2) DEFAULT 0 CHECK (current_stock >= 0),
    last_unit_price NUMERIC(18,2) DEFAULT 0 CHECK (last_unit_price >= 0),
    last_supplier_id INT,
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_supplier
        FOREIGN KEY (last_supplier_id)
        REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================
-- TABLA: prediction_parameters
-- =========================

CREATE TABLE prediction_parameters (
    parameter_id SERIAL PRIMARY KEY,
    reorder_threshold_days INT DEFAULT 14 CHECK (reorder_threshold_days > 0),
    urgent_threshold_days INT DEFAULT 7 CHECK (urgent_threshold_days > 0),
    analysis_period_days INT DEFAULT 30 CHECK (analysis_period_days > 0),
    initial_stock NUMERIC(18,2) DEFAULT 100 CHECK (initial_stock >= 0),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_thresholds
        CHECK (urgent_threshold_days < reorder_threshold_days)
);