from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class InvoiceProductCreate(BaseModel):
    descripcion: str = Field(..., min_length=1)
    cantidad: Decimal = Field(..., ge=0)
    unidad: Optional[str] = "unidad"
    precio_unitario: Decimal = Field(..., ge=0)
    precio_total: Decimal = Field(..., ge=0)


class InvoiceCreate(BaseModel):
    proveedor: str = Field(..., min_length=1)
    numero_factura: Optional[str] = None
    fecha: Optional[date] = None
    moneda: Optional[str] = "CRC"
    subtotal: Decimal = Field(default=0, ge=0)
    impuestos: Decimal = Field(default=0, ge=0)
    total: Decimal = Field(default=0, ge=0)
    source_file_name: Optional[str] = None
    productos: List[InvoiceProductCreate] = Field(..., min_length=1)


class InvoiceCreateResponse(BaseModel):
    message: str
    invoice_id: int
    products_received: int