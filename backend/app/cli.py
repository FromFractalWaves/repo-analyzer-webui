# backend/cli.py
#!/usr/bin/env python3
import argparse
import os
import sys
from app.services.job_manager import job_manager
from app.services.analysis import analysis_service

def parse_args():
    parser = argparse.ArgumentParser(description="Analyze Git repositories.")
    parser.add_argument("-d", "--dir", default=".", help="Base directory to search for repositories (default: current directory)")
    parser.add_argument("-o", "--output", default="./repo_analysis", help="Output directory for reports and visualizations")
    parser.add_argument("-y", "--yes", action="store_true", help="Skip confirmation and proceed with all repositories found")
    parser.add_argument("-r", "--recursive", action="store_true", help="Search for repositories recursively")
    parser.add_argument("-n", "--no-reports", action="store_true", help="Skip report generation, only collect and save data")
    parser.add_argument("-h", "--help", action="store_true", help="Show this help message")
    return parser.parse_args()

def main():
    args = parse_args()

    if args.help:
        parse_args().print_help()
        sys.exit(0)

    # Validate base directory
    base_dir = os.path.abspath(args.dir)
    if not os.path.isdir(base_dir):
        print(f"Error: Base directory '{base_dir}' does not exist.")
        sys.exit(1)

    # Check requirements
    try:
        analysis_service.check_requirements()
        print("All required packages are installed.")
    except (FileNotFoundError, ImportError) as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

    # Set up output directory
    output_dir = os.path.abspath(args.output)
    print(f"Starting repository analysis in {base_dir}...")
    print(f"Output will be saved to {output_dir}")

    # Run analysis
    try:
        job = job_manager.run_analysis_sync(
            repo_path=base_dir,
            output_dir=output_dir,
            recursive=args.recursive,
            skip_confirmation=args.yes
        )
        if job.status == "completed":
            print(f"Analysis complete! Results are available in: {output_dir}")
            if job.report_path:
                print(f"Report generated: {job.report_path}")
        else:
            print(f"Error: Analysis failed - {job.error}")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()