from fastapi import APIRouter

from app.services.inventory_service import (
    get_inventory_items,
    get_inventory_traffic_light,
)


router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/")
def list_inventory():
    return {
        "items": get_inventory_items()
    }


@router.get("/traffic-light")
def list_inventory_traffic_light():
    return {
        "items": get_inventory_traffic_light()
    }