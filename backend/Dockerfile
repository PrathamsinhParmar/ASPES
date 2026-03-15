# ASPES Backend - Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH /app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLP data models
RUN python -m spacy download en_core_web_sm
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Copy project files
COPY . .

# Create upload directories
RUN mkdir -p uploads/temp logs

# Expose port
EXPOSE 8000

# Entrypoint script to handle migrations and start app
# Note: In a real production setup, migrations would be handled differently
CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
