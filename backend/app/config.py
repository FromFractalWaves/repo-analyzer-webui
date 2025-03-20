import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Update DATABASE_URL to point to data/database.db
    DATABASE_URL: str = "sqlite:///data/database.db"
    REPORTS_DIR: str = "./reports"
    REPO_ANALYZER_PATH: str = "./repo_analyzer.py"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure the data directory exists
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)