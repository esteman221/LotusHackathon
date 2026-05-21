from app.services.inventory_service import get_inventory_traffic_light


def generate_inventory_recommendations_preview() -> dict:
    """
    Esta función deja preparado el espacio para IA.

    Por ahora NO llama a Claude.
    En una fase posterior hará esto:

    1. Consultar productos rojos, amarillos, negros y grises.
    2. Enviar esos datos a Claude.
    3. Pedir recomendaciones de compra, ahorro y control de pérdidas.
    4. Devolver recomendaciones en lenguaje natural.
    """

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
                "text": "Cuando se conecte Claude, aquí se generarán recomendaciones de compra y ahorro usando los datos reales del inventario."
            }
        ]
    }