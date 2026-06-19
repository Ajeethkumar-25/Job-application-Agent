# --- Stage 1: Build the React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend-build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV VITE_API_URL=""
RUN npm run build

# --- Stage 2: Run the Python FastAPI Backend ---
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN playwright install chromium

COPY . .

# Copy built frontend assets from Stage 1 into the static directory of backend
COPY --from=frontend-builder /frontend-build/dist ./backend/static

WORKDIR /app/backend

# Ensure data directory exists inside /app/backend/data
RUN mkdir -p data

ENV PYTHONPATH=/app/backend

EXPOSE 8000

# Bind to PORT env variable supplied by hosting provider
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
