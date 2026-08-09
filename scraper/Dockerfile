# syntax=docker/dockerfile:1
# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set Python runtime env
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install dependencies first for better layer caching
COPY requirements.txt .
# Install build tools for ARM (Raspberry Pi), then pip deps, then clean up
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    pip install --no-cache-dir --prefer-binary -r requirements.txt && \
    apt-get purge -y --auto-remove build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy the application code
COPY . .

# Create a non-root user for security
RUN useradd -m app && chown -R app:app /app

# Expose the port FastAPI will run on
EXPOSE 8000

# Use the non-root user
USER app

# Define the command to run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
