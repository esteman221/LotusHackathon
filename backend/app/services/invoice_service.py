from decimal import Decimal
from typing import Any

from psycopg.types.json import Jsonb

from app.db.connection import get_connection
from app.schemas.invoice import InvoiceCreate


def _decimal_to_float(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, list):
        return [_decimal_to_float(item) for item in value]

    if isinstance(value, dict):
        return {
            key: _decimal_to_float(item)
            for key, item in value.items()
        }

    return value


def register_invoice(invoice: InvoiceCreate) -> int:
    products_as_dicts = [
        {
            "descripcion": product.descripcion,
            "cantidad": _decimal_to_float(product.cantidad),
            "unidad": product.unidad,
            "precio_unitario": _decimal_to_float(product.precio_unitario),
            "precio_total": _decimal_to_float(product.precio_total),
        }
        for product in invoice.productos
    ]

    query = """
        SELECT register_invoice(
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        ) AS invoice_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (
                    invoice.proveedor,
                    invoice.numero_factura,
                    invoice.fecha,
                    invoice.moneda,
                    invoice.subtotal,
                    invoice.impuestos,
                    invoice.total,
                    invoice.source_file_name,
                    Jsonb(products_as_dicts),
                ),
            )

            result = cur.fetchone()
            conn.commit()

    return result["invoice_id"]