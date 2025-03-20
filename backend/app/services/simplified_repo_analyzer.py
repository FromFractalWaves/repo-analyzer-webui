"""
simplified_repo_analyzer.py: Core functionality for analyzing Git repositories.

Streamlined version of repo_analyzer.py that works with the FastAPI backend.
"""

import os
import sys
import re
import subprocess
import datetime
import json
from collections import Counter
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def find_git_repos(base_dir, recursive=False):
    """Find all git repositories in the given directory."""
    repos = []
    base_dir = os.path.abspath(base_dir)
    found_repo_paths = set()
    
    for root, dirs, files in os.walk(base_dir):
        # Skip .git directories during traversal
        if ".git" in dirs:
            dirs.remove(".git")
            
        # Check if current directory is a git repository
        git_dir = os.path.join(root, ".git")
        if os.path.isdir(git_dir):
            repo_path = os.path.abspath(root)
            
            # Skip if already processed
            if repo_path in found_repo_paths:
                continue
                
            # Add to found repos
            found_repo_paths.add(repo_path)
            
            # Create a name that is the relative path from base_dir
            if repo_path == base_dir:
                repo_name = os.path.basename(repo_path)
            else:
                repo_name = os.path.relpath(repo_path, base_dir)
            
            repos.append((repo_name, repo_path))
            
            # If not recursive, do not look for repos inside this repo
            if not recursive:
                dirs.clear()
    
    return repos

def get_commit_history(repo_path):
    """Extract commit history for a repository."""
    original_dir = os.getcwd()
    
    try:
        os.chdir(repo_path)
        
        cmd = [
            'git', 'log', '--all', 
            '--format=%H|%an|%ae|%at|%cn|%ce|%ct|%s'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        commits = []
        
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            
            parts = line.split('|')
            if len(parts) < 8:
                continue
                
            commit_hash, author, author_email, author_timestamp, committer, committer_email, committer_timestamp, message = parts[:8]
            
            # Convert timestamps to datetime
            author_date = datetime.datetime.fromtimestamp(int(author_timestamp))
            commit_date = datetime.datetime.fromtimestamp(int(committer_timestamp))
            
            commits.append({
                'hash': commit_hash,
                'author': author,
                'author_email': author_email,
                'author_date': author_date,
                'committer': committer,
                'committer_email': committer_email,
                'commit_date': commit_date,
                'message': message
            })
        
        return commits
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting commit history: {e}")
        return []
    finally:
        os.chdir(original_dir)

def get_branch_info(repo_path):
    """Get branch information for a repository."""
    original_dir = os.getcwd()
    
    try:
        os.chdir(repo_path)
        
        cmd = ['git', 'branch', '-a']
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        branches = []
        
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            
            branch = line.strip()
            is_current = False
            
            if branch.startswith('*'):
                is_current = True
                branch = branch[1:].strip()
            
            # Skip remote branches for simplicity
            if branch.startswith('remotes/'):
                continue
            
            branches.append({
                'name': branch,
                'is_current': is_current
            })
        
        return branches
    except subprocess.CalledProcessError as e:
        logger.error(f"Error getting branch info: {e}")
        return []
    finally:
        os.chdir(original_dir)

def get_code_stats(repo_path, commits):
    """Get code statistics for a repository."""
    original_dir = os.getcwd()
    try:
        os.chdir(repo_path)
        total_lines = 0

        if not commits:
            return {'total_lines': 0, 'file_count': 0}

        # Get the total lines added across all commits
        for i, commit in enumerate(commits):
            if i == len(commits) - 1:  # Last commit (earliest chronologically)
                cmd = ['git', 'diff', '--shortstat', '4b825dc642cb6eb9a060e54bf8d69288fbee4904', commit['hash']]
            else:
                cmd = ['git', 'diff', '--shortstat', commit['hash'] + '^', commit['hash']]

            try:
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                for line in result.stdout.splitlines():
                    match = re.search(r'(\d+) insertion[s]?', line)
                    if match:
                        total_lines += int(match.group(1))
            except subprocess.CalledProcessError:
                # Skip if this commit doesn't have a parent
                pass

        # Count source files
        extensions = ['.py', '.js', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.rb', '.go', '.ts']
        file_count = 0
        file_extensions = {}
        
        for root, _, files in os.walk('.'):
            if '.git' in root:
                continue
                
            for file in files:
                _, ext = os.path.splitext(file)
                if ext:
                    file_extensions[ext] = file_extensions.get(ext, 0) + 1
                    if ext in extensions:
                        file_count += 1
        
        return {
            'total_lines': total_lines, 
            'file_count': file_count,
            'file_extensions': file_extensions
        }
    except Exception as e:
        logger.error(f"Error processing code stats: {e}")
        return {'total_lines': 0, 'file_count': 0}
    finally:
        os.chdir(original_dir)

def calculate_repo_summary(repo_name, commits, branches, code_stats):
    """Calculate summary statistics for a repository."""
    summary = {
        'name': repo_name,
        'num_commits': len(commits),
        'num_branches': len(branches),
        'total_lines': code_stats.get('total_lines', 0),
        'file_count': code_stats.get('file_count', 0),
        'file_extensions': code_stats.get('file_extensions', {})
    }
    
    if commits:
        # Sort commits by date
        sorted_commits = sorted(commits, key=lambda x: x['commit_date'])
        
        # First and last commit dates
        earliest = sorted_commits[0]['commit_date']
        latest = sorted_commits[-1]['commit_date']
        
        summary['first_commit'] = earliest
        summary['last_commit'] = latest
        summary['time_span_days'] = (latest - earliest).days
        
        # Calculate commits per day
        days = max(1, (latest - earliest).total_seconds() / (24 * 60 * 60))
        summary['commits_per_day'] = len(commits) / days
        
        # Analyze commit messages
        messages = [commit['message'] for commit in commits]
        words = ' '.join(messages).lower().split()
        word_counts = Counter(words)
        
        summary['frequent_words'] = dict(word_counts.most_common(10))
        
        # Calculate active contributors
        authors = {commit['author_email'] for commit in commits}
        summary['contributor_count'] = len(authors)
    
    return summary

def analyze_repository(repo_path, output_dir):
    """Analyze a single repository and save results."""
    os.makedirs(output_dir, exist_ok=True)
    
    repo_name = os.path.basename(repo_path)
    logger.info(f"Analyzing repository: {repo_name}")
    
    # Get commit history
    logger.info("Getting commit history...")
    commits = get_commit_history(repo_path)
    
    # Get branch information
    logger.info("Getting branch information...")
    branches = get_branch_info(repo_path)
    
    # Get code statistics
    logger.info("Getting code statistics...")
    stats = get_code_stats(repo_path, commits)
    
    # Calculate summary statistics
    logger.info("Calculating summary statistics...")
    summary = calculate_repo_summary(repo_name, commits, branches, stats)
    
    # Prepare data for serialization
    data = {
        'repository': {
            'name': repo_name,
            'path': repo_path
        },
        'commits': [
            {
                'hash': commit['hash'],
                'author': commit['author'],
                'author_email': commit['author_email'],
                'author_date': commit['author_date'].isoformat(),
                'commit_date': commit['commit_date'].isoformat(),
                'message': commit['message']
            }
            for commit in commits
        ],
        'branches': branches,
        'code_stats': stats,
        'summary': {
            k: (v.isoformat() if isinstance(v, datetime.datetime) else v)
            for k, v in summary.items()
        }
    }
    
    # Save to file
    data_file = os.path.join(output_dir, "repo_data.json")
    with open(data_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    return data, data_file

def generate_report(data, output_dir):
    """Generate a markdown report from the analysis data."""
    repo_name = data['repository']['name']
    summary = data['summary']
    
    report = f"# Repository Analysis Report: {repo_name}\n\n"
    
    # Basic stats
    report += "## Repository Statistics\n\n"
    report += f"- **Repository Name:** {repo_name}\n"
    report += f"- **Repository Path:** {data['repository']['path']}\n"
    report += f"- **Total Commits:** {summary['num_commits']}\n"
    report += f"- **Total Branches:** {summary['num_branches']}\n"
    report += f"- **Total Files:** {summary['file_count']}\n"
    report += f"- **Total Lines of Code:** {summary['total_lines']}\n"
    
    # Time span
    if 'first_commit' in summary and 'last_commit' in summary:
        report += f"- **First Commit:** {summary['first_commit']}\n"
        report += f"- **Last Commit:** {summary['last_commit']}\n"
        report += f"- **Repository Age:** {summary['time_span_days']} days\n"
    
    # Contributors
    if 'contributor_count' in summary:
        report += f"- **Total Contributors:** {summary['contributor_count']}\n"
    
    # Activity metrics
    if 'commits_per_day' in summary:
        report += f"- **Average Commits Per Day:** {summary['commits_per_day']:.2f}\n"
    
    # File extensions
    report += "\n## File Types\n\n"
    if 'file_extensions' in summary:
        for ext, count in sorted(summary['file_extensions'].items(), key=lambda x: x[1], reverse=True)[:10]:
            report += f"- **{ext}:** {count} files\n"
    
    # Common words in commit messages
    report += "\n## Common Words in Commit Messages\n\n"
    if 'frequent_words' in summary:
        for word, count in summary['frequent_words'].items():
            report += f"- **{word}:** {count} occurrences\n"
    
    # Recent commits
    report += "\n## Recent Commits\n\n"
    recent_commits = sorted(data['commits'], key=lambda x: x['commit_date'], reverse=True)[:10]
    for commit in recent_commits:
        date = datetime.datetime.fromisoformat(commit['commit_date']).strftime('%Y-%m-%d %H:%M:%S')
        report += f"- **{date}** - {commit['message']} (by {commit['author']})\n"
    
    # Save the report
    report_file = os.path.join(output_dir, "repo_analysis_report.md")
    with open(report_file, 'w') as f:
        f.write(report)
    
    # Also create an HTML version
    html_report = f"""
    <html>
    <head>
        <title>Repository Analysis Report: {repo_name}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
            h1, h2 {{ color: #333; }}
            ul {{ list-style-type: none; padding-left: 20px; }}
            li {{ margin-bottom: 8px; }}
            .stats {{ display: flex; flex-wrap: wrap; }}
            .stat-card {{ background: #f5f5f5; border-radius: 5px; padding: 15px; margin: 10px; flex: 1; min-width: 200px; }}
        </style>
    </head>
    <body>
        <h1>Repository Analysis Report: {repo_name}</h1>
        
        <h2>Repository Statistics</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>Basic Info</h3>
                <ul>
                    <li><strong>Repository Name:</strong> {repo_name}</li>
                    <li><strong>Repository Path:</strong> {data['repository']['path']}</li>
                </ul>
            </div>
            <div class="stat-card">
                <h3>Activity</h3>
                <ul>
                    <li><strong>Total Commits:</strong> {summary['num_commits']}</li>
                    <li><strong>Total Branches:</strong> {summary['num_branches']}</li>
                    <li><strong>Contributors:</strong> {summary.get('contributor_count', 'N/A')}</li>
                </ul>
            </div>
            <div class="stat-card">
                <h3>Code Base</h3>
                <ul>
                    <li><strong>Total Files:</strong> {summary['file_count']}</li>
                    <li><strong>Total Lines:</strong> {summary['total_lines']}</li>
                </ul>
            </div>
        </div>
        
        <h2>Recent Commits</h2>
        <ul>
    """
    
    for commit in recent_commits:
        date = datetime.datetime.fromisoformat(commit['commit_date']).strftime('%Y-%m-%d %H:%M:%S')
        html_report += f"<li><strong>{date}</strong> - {commit['message']} (by {commit['author']})</li>\n"
    
    html_report += """
        </ul>
    </body>
    </html>
    """
    
    html_file = os.path.join(output_dir, "repo_analysis_report.html")
    with open(html_file, 'w') as f:
        f.write(html_report)
    
    return {
        'markdown': report_file,
        'html': html_file
    }

def run_analysis(repo_path, output_dir, recursive=True, skip_confirmation=True, job_id=None, repo_id=None):
    """Main analysis function to be called from the backend service.
    
    Args:
        repo_path: The path to the repository or directory containing repositories
        output_dir: Directory to save report files
        recursive: Whether to search recursively for repositories
        skip_confirmation: Whether to skip user confirmation for multiple repositories
        job_id: The ID of the job in the database (if applicable)
        repo_id: The ID of the repository in the database (if applicable)
        
    Returns:
        A tuple containing (results_dict, error_message)
    """
    try:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Find repositories
        repos = find_git_repos(repo_path, recursive)
        
        if not repos:
            logger.warning(f"No Git repositories found in {repo_path}")
            return None, "No Git repositories found"
        
        # If skip_confirmation is False and there are multiple repos, we would normally ask for confirmation
        # In a backend context, we'll assume confirmation is given or check the parameter
        if not skip_confirmation and len(repos) > 1:
            logger.info(f"Found {len(repos)} repositories, but confirmation is required")
            return None, "Confirmation required for multiple repositories"
        
        # Analyze each repository
        results = {}
        
        for repo_name, repo_path in repos:
            logger.info(f"Analyzing repository: {repo_name} at {repo_path}")
            
            # Create a directory for this repository's results
            repo_output_dir = os.path.join(output_dir, repo_name.replace('/', '_'))
            os.makedirs(repo_output_dir, exist_ok=True)
            
            # Analyze and get data
            data, data_file = analyze_repository(repo_path, repo_output_dir)
            
            # Generate report
            report_files = generate_report(data, repo_output_dir)
            
            # Add to results
            results[repo_name] = {
                'data': data,
                'data_file': data_file,
                'report_files': report_files
            }
            
            # If repo_id is provided, this means we're working with a specific repository 
            # from the database and should update its metadata
            if repo_id and len(repos) == 1:
                try:
                    # The database updates should be handled by the calling service
                    # But we'll prepare the data in the right format for it
                    metadata = {
                        'analysis_summary': {
                            'timestamp': datetime.datetime.now().isoformat(),
                            'job_id': job_id,
                            'num_commits': data['summary']['num_commits'],
                            'num_branches': data['summary']['num_branches'],
                            'total_lines': data['summary']['total_lines'],
                            'file_count': data['summary']['file_count']
                        }
                    }
                    
                    # Add this information to the results
                    results[repo_name]['metadata'] = metadata
                    
                    # Add last commit date if available
                    if 'last_commit' in data['summary']:
                        results[repo_name]['last_commit_date'] = data['summary']['last_commit']
                
                except Exception as e:
                    logger.error(f"Error preparing repository metadata: {str(e)}")
        
        # Save overall summary 
        summary = {
            'repositories_analyzed': len(results),
            'repository_names': list(results.keys()),
            'timestamp': datetime.datetime.now().isoformat(),
            'job_id': job_id
        }
        
        summary_file = os.path.join(output_dir, "analysis_summary.json")
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"Analysis complete. Results saved to {output_dir}")
        
        return results, None  # Return results and no error
    
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        return None, str(e)  # Return no results and the error