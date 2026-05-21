from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.invoice import InvoiceCreate, InvoiceCreateResponse
from app.services.ai_service import extract_invoice_with_gemini
from app.services.invoice_service import register_invoice


router = APIRouter(prefix="/invoices", tags=["Invoices"])


ALLOWED_MEDIA_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
}


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


@router.post("/extract")
async def extract_invoice(file: UploadFile = File(...)):
    try:
        if file.content_type not in ALLOWED_MEDIA_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Formato no soportado. Use JPG, PNG, WEBP, GIF o PDF.",
            )

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="El archivo está vacío.",
            )

        max_size_mb = 10
        max_size_bytes = max_size_mb * 1024 * 1024

        if len(file_bytes) > max_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"El archivo supera el máximo permitido de {max_size_mb} MB.",
            )

        extracted_invoice = extract_invoice_with_gemini(
            file_bytes=file_bytes,
            media_type=file.content_type,
        )

        return {
            "message": "Factura extraída correctamente",
            "file_name": file.filename,
            "content_type": file.content_type,
            "invoice": extracted_invoice,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo extraer la factura con Gemini: {str(error)}",
        )