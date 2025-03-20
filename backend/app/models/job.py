# backend/models/job.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnalysisJob(BaseModel):
    id: str
    status: str
    created_at: str
    completed_at: Optional[str] = None
    repo_path: str
    report_path: Optional[str] = None
    error: Optional[str] = None
    repo_id: Optional[str] = None  # New optional field to link to a repository

    @classmethod
    def from_db_row(cls, row):
        """Create an AnalysisJob from a SQLite row."""
        # Use dictionary-style access and provide a default of None if repo_id is missing
        return cls(
            id=row["id"],
            status=row["status"],
            created_at=row["created_at"],
            completed_at=row["completed_at"],
            repo_path=row["repo_path"],
            report_path=row["report_path"],
            error=row["error"],
            repo_id=row["repo_id"] if "repo_id" in row else None  # Safely handle optional field
        )

class AnalysisRequest(BaseModel):
    repo_path: str
    recursive: bool = True
    skip_confirmation: bool = True
    output_name: Optional[str] = None
    repo_id: Optional[str] = None  # New optional field