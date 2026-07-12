FROM python:3.12-slim

WORKDIR /app

# Install system dependencies if required for some ML packages (like gcc for lightgbm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Install fastapi and uvicorn explicitly in case they aren't in requirements.txt
RUN pip install --no-cache-dir fastapi uvicorn redis

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
