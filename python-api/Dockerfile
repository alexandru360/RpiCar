FROM python:3.11-slim

WORKDIR /app

# Install minimal system deps (add more if your requirements need them)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libatlas-base-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy application
COPY . /app

# If you have a requirements.txt, it will be installed. Otherwise fallback to flask only.
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else pip install --no-cache-dir flask; fi

ENV PYTHONUNBUFFERED=1
EXPOSE 5000

CMD ["/usr/local/bin/python", "run_car.py"]
