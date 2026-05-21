from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, inventory, invoices, recommendations
from app.core.config import settings
from app.db.connection import close_db_pool, init_db_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_pool()
    yield
    close_db_pool()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend de FacturaAI para conectar PostgreSQL, inventario e IA.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <-- Cambiado a "*" para permitir peticiones desde cualquier origen en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(inventory.router)
app.include_router(recommendations.router)
app.include_router(invoices.router)

@app.get("/")
def root():
    return {
        "message": "FacturaAI Backend funcionando",
        "docs": "/docs"
    }