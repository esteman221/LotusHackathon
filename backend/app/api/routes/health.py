from fastapi import APIRouter

from app.db.connection import get_connection


router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "FacturaAI Backend"
    }


@router.get("/db")
def database_health_check():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS result;")
            result = cur.fetchone()

    return {
        "database": "connected",
        "result": result["result"]
    }