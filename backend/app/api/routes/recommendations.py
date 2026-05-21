from fastapi import APIRouter

from app.services.ai_service import generate_inventory_recommendations_preview


router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/")
def get_recommendations():
    return generate_inventory_recommendations_preview()  