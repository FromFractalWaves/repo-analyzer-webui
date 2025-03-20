# backend/api/__init__.py
from .routes import app  # Export the FastAPI app with routes

__all__ = ["app"]