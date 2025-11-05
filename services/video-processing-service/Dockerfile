# Video Processing Service Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for video output
RUN mkdir -p /tmp/scriptsensei/videos

# Expose port for FastAPI
EXPOSE 8012

# Default command (can be overridden by docker-compose)
CMD ["uvicorn", "app.main:socket_app", "--host", "0.0.0.0", "--port", "8012"]
