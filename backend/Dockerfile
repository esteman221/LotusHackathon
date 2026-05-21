FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias esenciales del sistema para compilar drivers de Postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar requerimientos de Python primero (aprovecha la caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el contenido de la carpeta backend al contenedor
COPY . .

EXPOSE 8000

# Apuntamos a app.main:app porque main.py está dentro de la carpeta app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]