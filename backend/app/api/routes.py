# backend/api/routes.py
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.services.job_manager import job_manager
from backend.services.repository_service import repository_service
from backend.models.job import AnalysisRequest, AnalysisJob
from backend.models.repository import Repository, RepositoryFilter
from typing import List, Optional, Dict
import os
import stat
import time
import json
from backend.config import settings

app = FastAPI(title="Repo-Analyzer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to expand home directory
def expand_user_path(path: str) -> str:
    """Expand ~ to user's home directory"""
    if path.startswith('~'):
        return os.path.expanduser(path)
    return path

# Existing endpoints (unchanged)
@app.post("/analyze", response_model=AnalysisJob)
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Start a repository analysis job."""
    expanded_repo_path = expand_user_path(request.repo_path)
    
    if not os.path.exists(expanded_repo_path):
        raise HTTPException(status_code=400, detail=f"Repository path does not exist: {expanded_repo_path}")
    
    job = job_manager.create_job(expanded_repo_path, request.recursive, request.skip_confirmation, request.repo_id)
    background_tasks.add_task(
        job_manager.run_analysis_task,
        job.id,
        expanded_repo_path,
        request.recursive,
        request.skip_confirmation,
        request.output_name,
        request.repo_id
    )
    return job

@app.get("/jobs", response_model=List[AnalysisJob])
async def list_jobs():
    """List all analysis jobs."""
    return job_manager.get_all_jobs()

@app.get("/jobs/{job_id}", response_model=AnalysisJob)
async def get_job(job_id: str):
    """Get status of a specific analysis job."""
    try:
        return job_manager.get_job(job_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Job not found")

@app.get("/jobs/{job_id}/report")
async def get_report(job_id: str):
    """Get the report for a completed job."""
    try:
        job = job_manager.get_job(job_id)
        if job.status != "completed":
            raise HTTPException(status_code=400, detail="Job is not completed")
        if not job.report_path or not os.path.exists(job.report_path):
            raise HTTPException(status_code=404, detail="Report not found")
        
        with open(job.report_path, "r") as f:
            report_content = f.read()
        return {"content": report_content}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/jobs/{job_id}/data")
async def get_data(job_id: str):
    """Get the raw data for a completed job."""
    try:
        job = job_manager.get_job(job_id)
        if job.status != "completed":
            raise HTTPException(status_code=400, detail="Job is not completed")
        
        data_path = os.path.join(settings.REPORTS_DIR, job_id, "repo_data.json")
        if not os.path.exists(data_path):
            raise HTTPException(status_code=404, detail="Data file not found")
        
        with open(data_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/browse_directory")
async def browse_directory(directory: str):
    """Browse a directory and return its contents."""
    expanded_dir = expand_user_path(directory)
    
    if not expanded_dir:
        expanded_dir = os.path.expanduser("~")
    
    if not os.path.exists(expanded_dir):
        raise HTTPException(status_code=400, detail=f"Directory does not exist: {expanded_dir}")
    if not os.path.isdir(expanded_dir):
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {expanded_dir}")

    contents = []
    try:
        for item in os.listdir(expanded_dir):
            item_path = os.path.join(expanded_dir, item)
            stats = os.stat(item_path)
            item_type = "directory" if stat.S_ISDIR(stats.st_mode) else "file"
            contents.append({
                "name": item,
                "path": item_path,
                "type": item_type,
                "size": stats.st_size if item_type == "file" else None,
                "modified": int(stats.st_mtime * 1000)  # Convert to milliseconds
            })
    except PermissionError:
        raise HTTPException(status_code=403, detail=f"Permission denied: Cannot access {expanded_dir}")

    parent_dir = os.path.dirname(expanded_dir) if expanded_dir != os.path.sep else None
    if parent_dir and not os.path.exists(parent_dir):
        parent_dir = None

    return {
        "current_dir": expanded_dir,
        "parent_dir": parent_dir,
        "contents": contents
    }

@app.get("/discover_repos")
async def discover_repos(base_dir: str, depth: int = 2):
    """Discover Git repositories in the base directory up to a specified depth."""
    expanded_dir = expand_user_path(base_dir)
    
    if not expanded_dir:
        expanded_dir = os.path.expanduser("~")
        
    if not os.path.exists(expanded_dir):
        raise HTTPException(status_code=400, detail=f"Base directory does not exist: {expanded_dir}")
    if not os.path.isdir(expanded_dir):
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {expanded_dir}")

    repositories = []
    def scan_directory(current_dir: str, current_depth: int):
        if current_depth > depth:
            return
        try:
            for item in os.listdir(current_dir):
                item_path = os.path.join(current_dir, item)
                if os.path.isdir(item_path):
                    git_path = os.path.join(item_path, ".git")
                    if os.path.isdir(git_path):
                        repositories.append({
                            "name": item,
                            "path": item_path,
                            "relative_path": os.path.relpath(item_path, expanded_dir)
                        })
                    else:
                        scan_directory(item_path, current_depth + 1)
        except PermissionError:
            pass  # Skip directories we don't have permission to access
    
    scan_directory(expanded_dir, 0)
    return repositories

# New Repository CRUD Endpoints
@app.get("/repositories", response_model=List[Repository])
async def list_repositories(
    search: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    tags: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
):
    """List repositories with filtering."""
    # Convert tags string to list if provided
    tag_list = None
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
    # Create filter
    repo_filter = RepositoryFilter(
        search=search,
        is_favorite=is_favorite,
        tags=tag_list,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return repository_service.find_repositories(repo_filter)


@app.get("/repositories/{repo_id}", response_model=Repository)
async def get_repository(repo_id: str):
    """Get a specific repository by ID."""
    try:
        repo = repository_service.get_repository(repo_id)
        repository_service.update_last_accessed(repo_id)  # Update last_accessed on retrieval
        return repo
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/repositories", response_model=Repository)
async def create_repository(repository: Repository):
    """Save a repository to the database."""
    try:
        return repository_service.create_repository(repository)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/repositories/{repo_id}", response_model=Repository)
async def update_repository(repo_id: str, repository: Repository):
    """Update a repository in the database."""
    try:
        if repository.id != repo_id:
            raise ValueError("Repository ID in body does not match URL")
        return repository_service.update_repository(repo_id, repository)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/repositories/{repo_id}")
async def delete_repository(repo_id: str):
    """Delete a repository from the database."""
    try:
        repository_service.delete_repository(repo_id)
        return {"message": "Repository deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/repositories/tags")
async def get_repository_tags():
    """Get all repository tags."""
    return repository_service.get_all_tags()

@app.post("/repositories/{repo_id}/favorite", response_model=Repository)
async def toggle_favorite(repo_id: str, is_favorite: bool):
    """Toggle favorite status for a repository."""
    try:
        return repository_service.toggle_favorite(repo_id, is_favorite)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/repositories/batch_update")
async def batch_update_repositories(updates: List[Dict]):
    """Update multiple repositories in a single request."""
    updated_count = repository_service.update_repositories_metadata(updates)
    return {"updated": updated_count}

# Add repository search endpoint
@app.get("/repositories/search", response_model=List[Repository])
async def search_repositories(
    query: str = Query(..., description="Search query for repository name, path, or tags"),
    limit: int = Query(10, description="Maximum number of results")
):
    """Search repositories by name, path, or tags."""
    repo_filter = RepositoryFilter(search=query)
    results = repository_service.find_repositories(repo_filter)
    return results[:limit]