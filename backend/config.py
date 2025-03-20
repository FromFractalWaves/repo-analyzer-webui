# backend/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///backend/db/repo_analyzer.db"
    REPORTS_DIR: str = "./reports"
    REPO_ANALYZER_PATH: str = "./repo_analyzer.py"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()