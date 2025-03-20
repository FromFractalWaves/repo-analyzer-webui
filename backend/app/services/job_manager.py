# backend/services/job_manager.py
import uuid
import os
from datetime import datetime
from typing import List, Optional
from backend.db.database import db
from backend.models.job import AnalysisJob
from backend.services.analysis import analysis_service
from backend.config import settings

class JobManager:
    def create_job(self, repo_path: str, recursive: bool = True, skip_confirmation: bool = True, repo_id: Optional[str] = None) -> AnalysisJob:
        """Create a new job and store it in the database."""
        job_id = str(uuid.uuid4())
        job = AnalysisJob(
            id=job_id,
            status="pending",
            created_at=datetime.now().isoformat(),
            repo_path=repo_path,
            repo_id=repo_id
        )
        with db.get_connection() as conn:
            conn.execute("""
                INSERT INTO jobs (id, status, created_at, repo_path, repo_id)
                VALUES (?, ?, ?, ?, ?)
            """, (job.id, job.status, job.created_at, job.repo_path, job.repo_id))
            conn.commit()
        return job

    def get_job(self, job_id: str) -> AnalysisJob:
        with db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
            row = cursor.fetchone()
            if not row:
                raise Exception("Job not found")
            return AnalysisJob.from_db_row(row)

    def get_all_jobs(self) -> List[AnalysisJob]:
        with db.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC")
            return [AnalysisJob.from_db_row(row) for row in cursor.fetchall()]

    def update_job(self, job: AnalysisJob):
        with db.get_connection() as conn:
            conn.execute("""
                UPDATE jobs
                SET status = ?, completed_at = ?, report_path = ?, error = ?
                WHERE id = ?
            """, (job.status, job.completed_at, job.report_path, job.error, job.id))
            conn.commit()
    
    def run_analysis_task(self, job_id: str, repo_path: str, recursive: bool = True, 
                        skip_confirmation: bool = True, output_name: Optional[str] = None, repo_id: Optional[str] = None):
        print(f"Starting analysis task for job {job_id}")
        try:
            job = self.get_job(job_id)
            job.status = "running"
            self.update_job(job)
            
            output_dir = os.path.join(settings.REPORTS_DIR, job_id)
            os.makedirs(output_dir, exist_ok=True)
            
            report_path = analysis_service.run_analysis(repo_path, output_dir, recursive, skip_confirmation)
            
            job.status = "completed"
            job.completed_at = datetime.now().isoformat()
            job.report_path = report_path
            
            # If repo_id provided, update the repository with analysis results
            if repo_id:
                try:
                    # Get repository
                    repo = repository_service.get_repository(repo_id)
                    
                    # Update repository metadata
                    if not repo.metadata:
                        repo.metadata = {}
                        
                    # Add analysis summary to metadata
                    data_path = os.path.join(output_dir, "repo_data.json")
                    if os.path.exists(data_path):
                        with open(data_path, "r") as f:
                            data = json.load(f)
                            
                        # Extract key metrics for the repository
                        if "aggregate_stats" in data:
                            repo.metadata["last_analysis"] = {
                                "date": job.completed_at,
                                "total_commits": data["aggregate_stats"].get("total_commits", 0),
                                "total_branches": data["aggregate_stats"].get("total_branches", 0),
                                "total_files": data["aggregate_stats"].get("total_files", 0),
                                "total_lines": data["aggregate_stats"].get("total_lines", 0)
                            }
                            
                            # Update last commit date if found in analysis
                            if "last_commit" in data["aggregate_stats"]:
                                repo.last_commit_date = data["aggregate_stats"]["last_commit"]
                    
                    # Update repository with job ID and metadata
                    repo.last_analysis_job_id = job_id
                    repository_service.update_repository(repo_id, repo)
                    
                except Exception as repo_error:
                    # Log error but don't fail the job
                    print(f"Error updating repository metadata: {str(repo_error)}")
            
        except Exception as e:
            job = self.get_job(job_id)
            job.status = "failed"
            job.completed_at = datetime.now().isoformat()
            job.error = str(e)
        
        self.update_job(job)
        print(f"Finished analysis task for job {job_id}, status: {job.status}")


job_manager = JobManager()