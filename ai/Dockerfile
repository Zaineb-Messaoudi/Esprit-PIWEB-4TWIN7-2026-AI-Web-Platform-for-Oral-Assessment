# Use official Python image
FROM python:3.13

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project files
COPY . .

# Create data directories (as in your config)
RUN mkdir -p data/sessions data/scripts data/models

# Expose FastAPI port
EXPOSE 8000

# Run the FastAPI app (adjust main:app if your entrypoint differs)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]