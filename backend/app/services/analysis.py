# backend/services/analysis.py
import subprocess
import os
from datetime import datetime
from backend.config import settings

class AnalysisService:
    def __init__(self):
        self.repo_analyzer_path = settings.REPO_ANALYZER_PATH
        self.reports_dir = settings.REPORTS_DIR

    def run_analysis(self, repo_path: str, output_dir: str, recursive: bool = True, skip_confirmation: bool = True):
        """Run repo_analyzer.py with given parameters."""
        try:
            os.makedirs(output_dir, exist_ok=True)
            cmd = [
                "python",
                self.repo_analyzer_path,
                "--dir", repo_path,
                "--output", output_dir
            ]
            if recursive:
                cmd.append("--recursive")
            if skip_confirmation:
                cmd.append("--yes")

            process = subprocess.run(
                cmd,
                text=True,
                capture_output=True,
                check=True
            )
            data_file = os.path.join(output_dir, "repo_data.json")
            if not os.path.exists(data_file):
                raise Exception("Analysis completed but no data file generated")
            
            report_file = os.path.join(output_dir, "repo_analysis_report.md")
            return report_file if os.path.exists(report_file) else None
        except Exception as e:
            raise Exception(f"Analysis failed: {str(e)}")

    def check_requirements(self):
        """Check if Python and required packages are available."""
        if not os.path.exists(self.repo_analyzer_path):
            raise FileNotFoundError(f"{self.repo_analyzer_path} not found")
        
        required_packages = ["pandas", "matplotlib", "seaborn", "numpy"]
        for package in required_packages:
            try:
                __import__(package)
            except ImportError:
                raise ImportError(f"Required package '{package}' is missing. Install with 'pip install {package}'")

analysis_service = AnalysisService()