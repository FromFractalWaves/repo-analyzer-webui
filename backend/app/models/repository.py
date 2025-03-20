# backend/models/repository.py - Enhanced

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import uuid
import json
from datetime import datetime

class RepositoryFilter(BaseModel):
    """Model for repository filtering parameters."""
    search: Optional[str] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None
    sort_by: Optional[str] = None  # "name", "lastAccessed", or "lastCommitDate"
    sort_order: Optional[str] = None  # "asc" or "desc"

class Repository(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    path: str
    relative_path: str
    is_favorite: bool = False
    last_accessed: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat())
    tags: Optional[str] = None  # Comma-separated tags
    last_commit_date: Optional[str] = None
    last_analysis_job_id: Optional[str] = None
    metadata: Optional[Dict] = None  # Additional repository metadata
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Repository from a SQLite row."""
        return cls(
            id=str(row["id"]) if row["id"] is not None else str(uuid.uuid4()),
            name=row["name"],
            path=row["path"],
            relative_path=row["relative_path"],
            is_favorite=bool(row["is_favorite"]),
            last_accessed=row["last_accessed"],
            tags=row["tags"],
            last_commit_date=row["last_commit_date"],
            last_analysis_job_id=row["last_analysis_job_id"],
            metadata=json.loads(row["metadata"]) if row["metadata"] else None
        )
    
    def to_db_dict(self):
        """Convert to a dictionary suitable for database storage."""
        return {
            "id": self.id,
            "name": self.name,
            "path": self.path,
            "relative_path": self.relative_path,
            "is_favorite": 1 if self.is_favorite else 0,
            "last_accessed": self.last_accessed,
            "tags": self.tags,
            "last_commit_date": self.last_commit_date,
            "last_analysis_job_id": self.last_analysis_job_id,
            "metadata": json.dumps(self.metadata) if self.metadata else None
        }
        
    @property
    def tag_list(self) -> List[str]:
        """Return tags as a list."""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]
