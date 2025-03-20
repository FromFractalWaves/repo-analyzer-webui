# backend/services/repository_service.py - Enhanced version

import os
from typing import List, Optional, Dict
import json
import sqlite3
from datetime import datetime
from backend.db.database import db
from backend.models.repository import Repository, RepositoryFilter

class RepositoryService:
    def __init__(self):
        self.db = db

    def create_repository(self, repository: Repository) -> Repository:
        """Save a repository to the database. If it already exists (by path), update it."""
        with self.db.get_connection() as conn:
            try:
                # First check if repository with this path already exists
                cursor = conn.execute("SELECT id FROM repositories WHERE path = ?", (repository.path,))
                existing = cursor.fetchone()
                if existing:
                    # Update the existing repository
                    repository.id = existing["id"]
                    return self.update_repository(existing["id"], repository)
                    
                # Otherwise, insert a new repository record.
                # Remove 'id' from the INSERT; let the DB assign it (assuming it's autoincrement)
                cursor = conn.execute("""
                    INSERT INTO repositories (name, path, relative_path, is_favorite, last_accessed, tags, 
                                              last_commit_date, last_analysis_job_id, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    repository.name,
                    repository.path,
                    repository.relative_path,
                    1 if repository.is_favorite else 0,
                    repository.last_accessed,
                    repository.tags,
                    repository.last_commit_date,
                    repository.last_analysis_job_id,
                    json.dumps(repository.metadata) if repository.metadata else None
                ))
                conn.commit()
                # Retrieve and set the generated id.
                repository.id = cursor.lastrowid
            except sqlite3.IntegrityError:
                # If we hit an integrity error (e.g., unique constraint), raise a descriptive error.
                raise ValueError(f"Repository with path '{repository.path}' already exists")
        return repository

    def update_repository(self, repository_id: int, repository: Repository) -> Repository:
        """Update an existing repository in the database."""
        with self.db.get_connection() as conn:
            try:
                conn.execute("""
                    UPDATE repositories 
                    SET name = ?, 
                        path = ?, 
                        relative_path = ?, 
                        is_favorite = ?, 
                        last_accessed = ?, 
                        tags = ?, 
                        last_commit_date = ?, 
                        last_analysis_job_id = ?, 
                        metadata = ?
                    WHERE id = ?
                """, (
                    repository.name,
                    repository.path,
                    repository.relative_path,
                    1 if repository.is_favorite else 0,
                    repository.last_accessed,
                    repository.tags,
                    repository.last_commit_date,
                    repository.last_analysis_job_id,
                    json.dumps(repository.metadata) if repository.metadata else None,
                    repository_id
                ))
                conn.commit()
            except sqlite3.Error as e:
                raise ValueError(f"Failed to update repository: {str(e)}")
        return repository

    # Advanced filtering to match frontend requirements
    def find_repositories(self, filters: Optional[RepositoryFilter] = None) -> List[Repository]:
        """Find repositories with advanced filtering."""
        query = "SELECT * FROM repositories"
        params = []
        
        # Apply filters if provided
        if filters:
            where_clauses = []
            
            if filters.is_favorite is not None:
                where_clauses.append("is_favorite = ?")
                params.append(1 if filters.is_favorite else 0)
            
            if filters.search:
                where_clauses.append("(name LIKE ? OR path LIKE ? OR tags LIKE ?)")
                search_param = f"%{filters.search}%"
                params.extend([search_param, search_param, search_param])
            
            if filters.tags:
                # Create clauses for each tag
                tag_clauses = []
                for tag in filters.tags:
                    tag_clauses.append("tags LIKE ?")
                    params.append(f"%{tag}%")
                if tag_clauses:
                    where_clauses.append(f"({' OR '.join(tag_clauses)})")
            
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
        
        # Add sorting
        sort_field = "last_accessed"
        sort_dir = "DESC"
        if filters and filters.sort_by:
            if filters.sort_by == "name":
                sort_field = "name"
            elif filters.sort_by == "lastCommitDate":
                sort_field = "last_commit_date"
            if filters.sort_order and filters.sort_order.upper() == "ASC":
                sort_dir = "ASC"
        
        query += f" ORDER BY {sort_field} {sort_dir}"
        
        with self.db.get_connection() as conn:
            cursor = conn.execute(query, params)
            return [Repository.from_db_row(row) for row in cursor.fetchall()]
        
    def update_repositories_metadata(self, repo_updates: List[Dict]) -> int:
        """Batch update repository metadata (like last commit dates)."""
        updated_count = 0
        with self.db.get_connection() as conn:
            for update in repo_updates:
                if "id" not in update or "metadata" not in update:
                    continue
                    
                repo_id = update["id"]
                metadata = update["metadata"]
                last_commit_date = update.get("last_commit_date")
                
                try:
                    cursor = conn.execute(
                        """
                        UPDATE repositories 
                        SET metadata = ?, last_commit_date = COALESCE(?, last_commit_date)
                        WHERE id = ?
                        """, 
                        (json.dumps(metadata), last_commit_date, repo_id)
                    )
                    if cursor.rowcount > 0:
                        updated_count += 1
                except sqlite3.Error:
                    # Log error but continue with other updates
                    pass
                    
            conn.commit()
        return updated_count

# Instantiate the enhanced repository service
repository_service = RepositoryService()
