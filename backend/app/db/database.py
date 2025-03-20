import sqlite3
from contextlib import contextmanager
from app.config import settings

class Database:
    def __init__(self):
        self.db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        # No need to create directory here since it's handled in config.py
        self._init_db()

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