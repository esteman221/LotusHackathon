from fastapi import APIRouter, HTTPException

from app.schemas.invoice import InvoiceCreate, InvoiceCreateResponse
from app.services.invoice_service import register_invoice


router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("/", response_model=InvoiceCreateResponse)
def create_invoice(invoice: InvoiceCreate):
    try:
        invoice_id = register_invoice(invoice)

        return {
            "message": "Factura registrada correctamente",
            "invoice_id": invoice_id,
            "products_received": len(invoice.productos),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo registrar la factura: {str(error)}",
        )