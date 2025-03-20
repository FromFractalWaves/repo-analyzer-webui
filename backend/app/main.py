# backend/main.py
from backend.api.routes import app
from backend.config import settings
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)