# backend/Dockerfile
FROM python:3.12-slim

# avoid interactive prompts from apt
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 1) System deps needed to build GDAL/rasterio, matplotlib, psycopg2, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    curl \
    ca-certificates \
    pkg-config \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    proj-bin \
    libproj-dev \
    libgeos-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# 2) Help libraries find gdal headers (sometimes needed during wheel build)
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal \
    C_INCLUDE_PATH=/usr/include/gdal \
    GDAL_CONFIG=/usr/bin/gdal-config

# 3) Workdir
WORKDIR /app

# 4) Install deps first (any change in the code will not trigger this step to run (unnecessary and slow!) - only step 5 runs)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt 

# 5) Copy app code (after libs so code changes don't bust the heavy pip layer)
COPY backend/ /app/

# 6) Default command (overridden by docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
