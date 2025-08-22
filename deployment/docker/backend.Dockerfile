# Backend API Service
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/app ./app
COPY data_science/models ./data_science/models

# Set environment variables
ENV PYTHONPATH=/app
ENV API_KEY=""  # Set this in production
ENV JWT_SECRET_KEY=""  # Set this in production
ENV DATABASE_URL=""  # Set this in production

# Run with gunicorn
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "app.main:app"]
