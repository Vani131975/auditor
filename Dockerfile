# 1️⃣ Build React Frontend
FROM node:20-alpine as build-step

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy all frontend files and build
COPY frontend/ ./
RUN npm run build && ls -la  # Verify dist/ exists

# 2️⃣ Setup Python Backend + OCR
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

# Copy backend code
COPY backend/ ./backend/

# Copy React build (dist/) to Flask static folder
COPY --from=build-step /app/frontend/dist ./backend/static

# Expose Render port
ENV PORT=10000
EXPOSE $PORT

# Set working directory to backend
WORKDIR /app/backend

# Run the Flask app with Gunicorn
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:10000", "app:create_app()"]