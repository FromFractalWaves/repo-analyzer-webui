# backend/db/database.py
import sqlite3
from contextlib import contextmanager
from app.config import settings

class Database:
    def __init__(self):
        self.db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        self._init_db()
        self.ensure_job_storage_tables()

    def _init_db(self):
        """Initialize the database with enhanced schema."""
        with self.get_connection() as conn:
            # Create repositories table first (since jobs will reference it)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS repositories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    path TEXT NOT NULL UNIQUE,
                    relative_path TEXT NOT NULL,
                    is_favorite INTEGER DEFAULT 0,
                    last_accessed TEXT,
                    tags TEXT,
                    last_commit_date TEXT,
                    last_analysis_job_id TEXT,
                    metadata TEXT
                )
            """)
            
            # Create jobs table with repo_id foreign key
            conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    repo_path TEXT NOT NULL,
                    report_path TEXT,
                    error TEXT,
                    repo_id TEXT,
                    FOREIGN KEY (repo_id) REFERENCES repositories(id)
                )
            """)
            
            # Add foreign key from repositories to jobs for last_analysis_job_id
            # This is a separate step to handle circular reference
            conn.execute("""
                CREATE TABLE IF NOT EXISTS repository_job_links (
                    repository_id TEXT,
                    job_id TEXT,
                    PRIMARY KEY (repository_id, job_id),
                    FOREIGN KEY (repository_id) REFERENCES repositories(id),
                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                )
            """)
            
            # Add indexes for performance
            conn.execute("CREATE INDEX IF NOT EXISTS idx_repos_favorite ON repositories(is_favorite)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_repos_last_accessed ON repositories(last_accessed)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_repo_id ON jobs(repo_id)")
            
            conn.commit()

        # Add this method to the Database class in app/db/database.py

    def ensure_job_storage_tables(self):
        """Create tables for storing job report content and analysis data."""
        with self.get_connection() as conn:
            # Create table for job reports
            conn.execute("""
                CREATE TABLE IF NOT EXISTS job_reports (
                    job_id TEXT PRIMARY KEY,
                    report_content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                )
            """)
            
            # Create table for job data
            conn.execute("""
                CREATE TABLE IF NOT EXISTS job_data (
                    job_id TEXT PRIMARY KEY,
                    analysis_data TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (job_id) REFERENCES jobs(id)
                )
            """)
            
            # Add indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_job_reports_job_id ON job_reports(job_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_job_data_job_id ON job_data(job_id)")
            
            conn.commit()

    @contextmanager
    def get_connection(self):
        """Provide a database connection with context management."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dict-like objects
        try:
            yield conn
        finally:
            conn.close()

db = Database()