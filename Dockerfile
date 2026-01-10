FROM python:3.11-alpine

WORKDIR /app

COPY Api/requirements.txt /app/Api/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/Api/requirements.txt

COPY Api /app/Api
COPY Web /app/Web

EXPOSE 8000

CMD ["python", "/app/Api/main.py"]
