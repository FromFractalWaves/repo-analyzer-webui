# backend/services/job_manager.py
import uuid
import os
import json
import math
from datetime import datetime
from typing import List, Optional
from app.db.database import db
from app.models.job import AnalysisJob
from app.services.analysis import analysis_service
from app.config import settings

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
        """Run an analysis job and update the database with results."""
        from app.services.repository_service import repository_service
        
        print(f"Starting analysis task for job {job_id}")
        try:
            # Get the job from database
            job = self.get_job(job_id)
            job.status = "running"
            self.update_job(job)
            
            # Set up output directory
            output_dir = os.path.join(settings.REPORTS_DIR, job_id)
            os.makedirs(output_dir, exist_ok=True)
            
            # Run the analysis - properly unpack the tuple returned by run_analysis
            results, error = analysis_service.run_analysis(
                repo_path, 
                output_dir, 
                recursive, 
                skip_confirmation,
                job_id,
                repo_id
            )
            
            if error:
                raise Exception(error)
            
            # We have the results dict now, which contains all repository data
            # Let's find the first repo or a specific one if we're looking for a single repo
            if results:
                # For single repository analysis
                if repo_id and len(results) == 1:
                    repo_name = list(results.keys())[0]
                    repo_data = results[repo_name]['data']
                    report_path = results[repo_name]['report_files']['markdown']
                    
                    # Save data to database
                    self.save_job_data(job_id, repo_data)
                    
                    # Save report to database
                    with open(report_path, "r") as f:
                        report_content = f.read()
                    self.save_job_report(job_id, report_content)
                else:
                    # For multiple repositories, use the first one's report or aggregate
                    first_repo = list(results.keys())[0]
                    report_path = results[first_repo]['report_files']['markdown']
                    
                    # Save full results data to database
                    self.save_job_data(job_id, results)
            else:
                report_path = None
            
            # Update job in database
            job.status = "completed"
            job.completed_at = datetime.now().isoformat()
            job.report_path = report_path  # Keep for backward compatibility
            self.update_job(job)
            
            # If repo_id provided, update the repository with analysis results
            if repo_id and results:
                try:
                    # Get repository from database
                    repo = repository_service.get_repository(repo_id)
                    
                    # Initialize metadata if not present
                    if not repo.metadata:
                        repo.metadata = {}
                    
                    # Get the repository data
                    repo_name = list(results.keys())[0]
                    repo_data = results[repo_name]['data']
                    
                    # Update repository metadata with analysis summary
                    repo.metadata["analysis_summary"] = {
                        "date": job.completed_at,
                        "job_id": job_id,
                        "num_commits": repo_data["summary"].get("num_commits", 0),
                        "num_branches": repo_data["summary"].get("num_branches", 0),
                        "file_count": repo_data["summary"].get("file_count", 0),
                        "total_lines": repo_data["summary"].get("total_lines", 0),
                        "contributor_count": repo_data["summary"].get("contributor_count", 0)
                    }
                    
                    # Update last commit date if available
                    if "last_commit" in repo_data["summary"]:
                        repo.last_commit_date = repo_data["summary"]["last_commit"]
                    
                    # Update last_analysis_job_id and save to database
                    repo.last_analysis_job_id = job_id
                    repository_service.update_repository(repo_id, repo)
                    print(f"Updated repository metadata for {repo_id}")
                    
                except Exception as repo_error:
                    # Log error but don't fail the job
                    print(f"Error updating repository metadata: {str(repo_error)}")
                    
        except Exception as e:
            # Update job with error information
            job = self.get_job(job_id)
            job.status = "failed"
            job.completed_at = datetime.now().isoformat()
            job.error = str(e)
            self.update_job(job)
            
            print(f"Analysis failed: {str(e)}")
        
        print(f"Finished analysis task for job {job_id}, status: {job.status}")


    def save_job_data(self, job_id: str, data: dict):
        """Save the analysis data for a job to the database."""
        # First sanitize the data to handle any non-JSON-compliant values
        def sanitize_json(obj):
            if isinstance(obj, dict):
                return {k: sanitize_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize_json(item) for item in obj]
            elif isinstance(obj, float) and (math.isinf(obj) or math.isnan(obj)):
                # Replace infinity and NaN with None (null in JSON)
                return None
            else:
                return obj
        
        sanitized_data = sanitize_json(data)
        
        # Convert to JSON string
        data_json = json.dumps(sanitized_data)
        
        # Save to database
        with db.get_connection() as conn:
            # Check if data already exists for this job
            cursor = conn.execute("SELECT 1 FROM job_data WHERE job_id = ?", (job_id,))
            exists = cursor.fetchone() is not None
            
            if exists:
                # Update existing record
                conn.execute("""
                    UPDATE job_data 
                    SET analysis_data = ?, created_at = ?
                    WHERE job_id = ?
                """, (data_json, datetime.now().isoformat(), job_id))
            else:
                # Insert new record
                conn.execute("""
                    INSERT INTO job_data (job_id, analysis_data, created_at)
                    VALUES (?, ?, ?)
                """, (job_id, data_json, datetime.now().isoformat()))
            
            conn.commit()

    def save_job_report(self, job_id: str, report_content: str):
        """Save the report content for a job to the database."""
        with db.get_connection() as conn:
            # Check if report already exists for this job
            cursor = conn.execute("SELECT 1 FROM job_reports WHERE job_id = ?", (job_id,))
            exists = cursor.fetchone() is not None
            
            if exists:
                # Update existing record
                conn.execute("""
                    UPDATE job_reports 
                    SET report_content = ?, created_at = ?
                    WHERE job_id = ?
                """, (report_content, datetime.now().isoformat(), job_id))
            else:
                # Insert new record
                conn.execute("""
                    INSERT INTO job_reports (job_id, report_content, created_at)
                    VALUES (?, ?, ?)
                """, (job_id, report_content, datetime.now().isoformat()))
            
            conn.commit()

    def get_job_data(self, job_id: str):
        """Get the analysis data for a job from the database."""
        with db.get_connection() as conn:
            cursor = conn.execute("SELECT analysis_data FROM job_data WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return json.loads(row['analysis_data'])

    def get_job_report(self, job_id: str):
        """Get the report content for a job from the database."""
        with db.get_connection() as conn:
            cursor = conn.execute("SELECT report_content FROM job_reports WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return row['report_content']


job_manager = JobManager()