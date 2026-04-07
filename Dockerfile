# ── Stage 1: Build React Frontend ─────────────────────────────────────────────
FROM node:20-alpine AS build-step

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy all frontend source and build
COPY frontend/ ./
# Override any local .env — in production the API is on the same origin
ENV VITE_API_URL=
RUN npm run build

# ── Stage 2: Python Backend ────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OCR and PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy the React build output into Flask's static folder
COPY --from=build-step /app/frontend/dist ./backend/static

# Set working directory to backend
WORKDIR /app/backend

# Render uses PORT env var; default to 10000
ENV PORT=10000
EXPOSE $PORT

# Run Flask via Gunicorn
# app:app references the module-level `app` created by create_app() in app.py
CMD ["sh", "-c", "gunicorn -w 2 -b 0.0.0.0:${PORT} app:app"]