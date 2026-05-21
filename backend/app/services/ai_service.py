import json
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.services.inventory_service import get_inventory_traffic_light


INVOICE_EXTRACTION_PROMPT = """
Eres un extractor de facturas para PYMES en Centroamérica.

Extrae los datos de la factura y responde ÚNICAMENTE con JSON válido.
No uses markdown.
No uses bloques de código.
No agregues explicación.

Formato exacto:
{
  "proveedor": string | null,
  "numero_factura": string | null,
  "fecha": "YYYY-MM-DD" | null,
  "moneda": string | null,
  "subtotal": number | null,
  "impuestos": number | null,
  "total": number | null,
  "productos": [
    {
      "descripcion": string | null,
      "cantidad": number | null,
      "unidad": string | null,
      "precio_unitario": number | null,
      "precio_total": number | null
    }
  ]
}

Si un campo no existe usa null.
Si no puedes leer productos, usa productos: [].
"""


def _get_gemini_client() -> genai.Client:
    if (
        not settings.gemini_api_key
        or settings.gemini_api_key == "TU_API_KEY_AQUI"
    ):
        raise ValueError("GEMINI_API_KEY no está configurada.")

    return genai.Client(api_key=settings.gemini_api_key)


def _clean_json_text(text: str) -> str:
    return (
        text.replace("```json", "")
        .replace("```JSON", "")
        .replace("```", "")
        .strip()
    )


def _safe_json_loads(text: str) -> dict[str, Any]:
    clean_text = _clean_json_text(text)

    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        start = clean_text.find("{")
        end = clean_text.rfind("}")

        if start == -1 or end == -1 or end <= start:
            raise ValueError("Gemini no devolvió un JSON válido.")

        possible_json = clean_text[start : end + 1]
        return json.loads(possible_json)


def _build_file_part(file_bytes: bytes, media_type: str):
    allowed_media_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
    }

    if media_type not in allowed_media_types:
        raise ValueError("Formato no soportado. Use JPG, PNG, WEBP, GIF o PDF.")

    return types.Part.from_bytes(
        data=file_bytes,
        mime_type=media_type,
    )


def extract_invoice_with_gemini(
    file_bytes: bytes,
    media_type: str,
) -> dict[str, Any]:
    client = _get_gemini_client()
    file_part = _build_file_part(file_bytes, media_type)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[
            file_part,
            INVOICE_EXTRACTION_PROMPT,
            "Extrae los datos de esta factura.",
        ],
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
        ),
    )

    if not response.text:
        raise ValueError("Gemini no devolvió texto.")

    parsed_invoice = _safe_json_loads(response.text)

    return {
        "proveedor": parsed_invoice.get("proveedor"),
        "numero_factura": parsed_invoice.get("numero_factura"),
        "fecha": parsed_invoice.get("fecha"),
        "moneda": parsed_invoice.get("moneda") or "CRC",
        "subtotal": parsed_invoice.get("subtotal"),
        "impuestos": parsed_invoice.get("impuestos"),
        "total": parsed_invoice.get("total"),
        "productos": parsed_invoice.get("productos") or [],
    }


def generate_inventory_recommendations_preview() -> dict:
    inventory = get_inventory_traffic_light()

    urgent_products = [
        item for item in inventory
        if item["traffic_light_status"] == "ROJO"
    ]

    slow_products = [
        item for item in inventory
        if item["traffic_light_status"] == "NEGRO"
    ]

    reorder_products = [
        item for item in inventory
        if item["traffic_light_status"] == "AMARILLO"
    ]

    return {
        "mode": "preview_without_ai",
        "message": "Espacio reservado para recomendaciones con IA en una fase posterior.",
        "summary": {
            "urgent_products": len(urgent_products),
            "reorder_products": len(reorder_products),
            "slow_rotation_products": len(slow_products),
            "total_products_analyzed": len(inventory),
        },
        "recommendations": [
            {
                "type": "system",
                "text": "Cuando se conecte Gemini, aquí se generarán recomendaciones de compra y ahorro usando los datos reales del inventario."
            }
        ]
    }