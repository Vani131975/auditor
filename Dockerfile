# Build React Frontend
FROM node:20-alpine as build-step
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Setup Python Backend & OCR
FROM python:3.11-slim
WORKDIR /app

# Install Tesseract OCR and system dependencies for PDF processing
# NEW (works for OCR)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask backend code
COPY backend/ ./backend/

# Copy React build files to Flask static serving folder
COPY --from=build-step /app/frontend/dist ./backend/static

# Expose port (Render defaults to 10000 or reads $PORT)
ENV PORT=10000
EXPOSE $PORT

# Run Gunicorn
WORKDIR /app/backend
CMD gunicorn -w 2 -b 0.0.0.0:$PORT "app:create_app()"
