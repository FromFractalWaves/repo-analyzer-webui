# backend/services/analysis.py 
import os
import subprocess
from datetime import datetime
from app.config import settings
from .simplified_repo_analyzer import run_analysis

class AnalysisService:
    def __init__(self):
        self.reports_dir = settings.REPORTS_DIR
    
    def run_analysis(self, repo_path: str, output_dir: str, recursive: bool = True, 
                    skip_confirmation: bool = True, job_id: str = None, repo_id: str = None):
        """Run repository analysis with the simplified analyzer."""
        try:
            os.makedirs(output_dir, exist_ok=True)
            
            # Call the simplified analyzer
            report_path = run_analysis(
                repo_path=repo_path,
                output_dir=output_dir,
                recursive=recursive,
                skip_confirmation=skip_confirmation,
                job_id=job_id,
                repo_id=repo_id
            )
            
            if not report_path:
                raise Exception("Analysis completed but no report was generated")
                
            return report_path
            
        except Exception as e:
            raise Exception(f"Analysis failed: {str(e)}")
    
    def check_requirements(self):
        """Check if Git and required packages are available."""
        # Check if git is available
        try:
            subprocess.run(['git', '--version'], capture_output=True, check=True)
        except (FileNotFoundError, subprocess.SubprocessError):
            raise FileNotFoundError("Git command not found. Please install Git.")
        
        # Check for essential Python packages
        required_packages = ["datetime", "json", "collections", "re"]
        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                raise ImportError(f"Required package '{package}' is missing.")

analysis_service = AnalysisService()