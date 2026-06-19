FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Chromium and dependencies are already pre-installed in the base image, but we need to ensure the python package knows it
RUN playwright install chromium

COPY . .

# Ensure data directory exists for SQLite
RUN mkdir -p data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
