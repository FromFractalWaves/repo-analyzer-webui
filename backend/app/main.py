# backend/main.py
from app.api.routes import app
from app.config import settings
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)