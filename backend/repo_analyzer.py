#!/usr/bin/env python3
"""
repo_analyzer.py: A standalone tool to analyze Git repositories recursively.

This script analyzes multiple repositories within a directory structure,
extracts commit history, branch information, and passes data to the visualization
module for report generation.

Usage:
    python repo_analyzer.py --dir /path/to/repos --recursive
"""

import re
import os
import sys
import argparse
import subprocess
import datetime
import json
from collections import Counter
import time

def find_git_repos(base_dir, recursive=False):
    """Find all git repositories in the given directory.
    
    Args:
        base_dir: The base directory to search in
        recursive: If True, search for nested repositories even inside other repositories
    """
    repos = []
    base_dir = os.path.abspath(base_dir)
    
    # For storing paths of already found repositories to avoid duplicates
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
                # Do not descend into other directories of this repo
                dirs.clear()
    
    return repos


def confirm_repos(repos):
    """Ask the user to confirm proceeding with the found repositories."""
    if not repos:
        print("No git repositories found.")
        return False
    
    print(f"\nFound {len(repos)} git repositories:")
    for i, (repo_name, repo_path) in enumerate(repos, 1):
        print(f"{i}. {repo_name} ({repo_path})")
    
    while True:
        response = input("\nProceed with analysis? (y/n): ").strip().lower()
        if response in ('y', 'yes'):
            return True
        elif response in ('n', 'no'):
            return False
        else:
            print("Please enter 'y' for yes or 'n' for no.")


def get_commit_history(repo_name, repo_path):
    """Extract commit history for a repository."""
    # Save the current directory
    original_dir = os.getcwd()
    
    try:
        # Change to the repo directory
        os.chdir(repo_path)
        
        # Get all commits with author date, committer date, hash, and message
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
            if len(parts) < 8:  # Need at least 8 parts
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
        print(f"Error getting commit history for {repo_name}: {e}")
        return []
    finally:
        # Restore the original directory
        os.chdir(original_dir)


def get_branch_info(repo_name, repo_path):
    """Get branch information for a repository."""
    # Save the current directory
    original_dir = os.getcwd()
    
    try:
        # Change to the repo directory
        os.chdir(repo_path)
        
        # Get all branches
        cmd = ['git', 'branch', '-a']
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        branches = []
        
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            
            # Remove leading spaces and * for current branch
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
        print(f"Error getting branch info for {repo_name}: {e}")
        return []
    finally:
        # Restore the original directory
        os.chdir(original_dir)

def get_code_stats(repo_name, repo_path, commits):
    original_dir = os.getcwd()
    try:
        os.chdir(repo_path)
        total_lines = 0

        if not commits:
            return {'total_lines': 0, 'file_count': 0}

        # Iterate over all commits, handling the first commit separately
        for i, commit in enumerate(commits):
            # For the first commit (no parent), compare against an empty tree
            if i == 0:
                cmd = ['git', 'diff', '--shortstat', '4b825dc642cb6eb9a060e54bf8d69288fbee4904', commit['hash']]
            else:
                cmd = ['git', 'diff', '--shortstat', commit['hash'] + '^', commit['hash']]

            try:
                result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                for line in result.stdout.splitlines():
                    # Example output: " 2 files changed, 10 insertions(+), 5 deletions(-)"
                    match = re.search(r'(\d+) insertion[s]?', line)
                    if match:
                        total_lines += int(match.group(1))
            except subprocess.CalledProcessError as e:
                print(f"Warning: Could not diff commit {commit['hash']} in {repo_name}: {e}")

        # Optionally, count only source files (e.g., .py, .c, .cpp, etc.)
        file_count = sum(1 for f in os.listdir('.') if os.path.isfile(f) and f.endswith(('.py', '.c', '.cpp', '.java', '.js')))
        
        return {'total_lines': total_lines, 'file_count': file_count}
    except Exception as e:
        print(f"Error processing code stats for {repo_name}: {e}")
        return {'total_lines': 0, 'file_count': 0}
    finally:
        os.chdir(original_dir)

def calculate_repo_summary(repo_name, commits, branches, code_stats):
    """Calculate summary statistics for a repository."""
    summary = {
        'num_commits': len(commits),
        'num_branches': len(branches),
        'total_lines': code_stats.get('total_lines', 0),
        'file_count': code_stats.get('file_count', 0),
        'file_extensions': code_stats.get('file_extensions', {}),
    }
    
    # Calculate time span
    if commits:
        earliest = min(commits, key=lambda x: x['commit_date'])['commit_date']
        latest = max(commits, key=lambda x: x['commit_date'])['commit_date']
        
        summary['first_commit'] = earliest
        summary['last_commit'] = latest
        summary['time_span'] = latest - earliest
        
        # Calculate commits per day
        days = max(1, (latest - earliest).total_seconds() / (24 * 60 * 60))
        summary['commits_per_day'] = len(commits) / days
        
        # Calculate average time between commits
        if len(commits) > 1:
            # Sort commits by date
            sorted_commits = sorted(commits, key=lambda x: x['commit_date'])
            
            # Calculate time differences
            time_diffs = [
                (sorted_commits[i+1]['commit_date'] - sorted_commits[i]['commit_date']).total_seconds()
                for i in range(len(sorted_commits) - 1)
            ]
            
            summary['avg_time_between_commits'] = sum(time_diffs) / len(time_diffs)
            summary['min_time_between_commits'] = min(time_diffs) if time_diffs else 0
            summary['max_time_between_commits'] = max(time_diffs) if time_diffs else 0
        else:
            summary['avg_time_between_commits'] = 0
            summary['min_time_between_commits'] = 0
            summary['max_time_between_commits'] = 0
        
        # Analyze commit messages
        messages = [commit['message'] for commit in commits]
        words = ' '.join(messages).lower().split()
        word_counts = Counter(words)
        
        summary['frequent_words'] = dict(word_counts.most_common(10))
        
        # Find peak commit rates
        if len(commits) > 5:  # Need at least a few commits for this analysis
            # Sort commits by date
            sorted_commits = sorted(commits, key=lambda x: x['commit_date'])
            
            # Look for bursts of activity (5+ commits in short period)
            window_size = 5
            best_window = None
            best_window_duration = float('inf')
            
            for i in range(len(sorted_commits) - window_size + 1):
                window = sorted_commits[i:i+window_size]
                duration = (window[-1]['commit_date'] - window[0]['commit_date']).total_seconds()
                
                if duration < best_window_duration:
                    best_window_duration = duration
                    best_window = window
            
            if best_window:
                summary['peak_pace_commits'] = window_size
                summary['peak_pace_duration'] = best_window_duration
                summary['peak_pace_start'] = best_window[0]['commit_date']
                summary['peak_pace_end'] = best_window[-1]['commit_date']
                
                # Commits per minute during peak
                summary['peak_commits_per_minute'] = (window_size * 60) / best_window_duration
        
        # Calculate lines per commit
        if len(commits) > 0:
            summary['lines_per_commit'] = code_stats.get('total_lines', 0) / len(commits)
        else:
            summary['lines_per_commit'] = 0
    
    return summary


def calculate_aggregate_stats(summaries):
    """Calculate aggregate statistics across all repositories."""
    # Total commits
    total_commits = sum(summary['num_commits'] for summary in summaries.values())
    
    # Total branches
    total_branches = sum(summary['num_branches'] for summary in summaries.values())
    
    # Total lines
    total_lines = sum(summary['total_lines'] for summary in summaries.values())
    
    # Calculate overall time span
    all_first_commits = [summary['first_commit'] for summary in summaries.values() if 'first_commit' in summary]
    all_last_commits = [summary['last_commit'] for summary in summaries.values() if 'last_commit' in summary]
    
    if all_first_commits and all_last_commits:
        earliest = min(all_first_commits)
        latest = max(all_last_commits)
        time_span = latest - earliest
        
        # Overall commits per day
        days = max(1, time_span.total_seconds() / (24 * 60 * 60))
        overall_commits_per_day = total_commits / days
    else:
        earliest = None
        latest = None
        time_span = None
        overall_commits_per_day = 0
    
    # Merge word counts
    all_words = {}
    for summary in summaries.values():
        for word, count in summary.get('frequent_words', {}).items():
            all_words[word] = all_words.get(word, 0) + count
    
    frequent_words = dict(Counter(all_words).most_common(10))
    
    # Find the fastest pace across all repos
    best_pace = float('inf')
    best_pace_repo = None
    
    for repo, summary in summaries.items():
        if 'min_time_between_commits' in summary and summary['min_time_between_commits'] > 0:
            if summary['min_time_between_commits'] < best_pace:
                best_pace = summary['min_time_between_commits']
                best_pace_repo = repo
    
    return {
        'total_commits': total_commits,
        'total_branches': total_branches,
        'total_lines': total_lines,
        'repos_analyzed': len(summaries),
        'first_commit': earliest,
        'last_commit': latest,
        'time_span': time_span,
        'overall_commits_per_day': overall_commits_per_day,
        'frequent_words': frequent_words,
        'fastest_pace': best_pace,
        'fastest_pace_repo': best_pace_repo
    }


def save_data(commit_data, branch_data, code_stats, summary_stats, aggregate_stats, output_file="repo_data.json"):
    """Save all collected data to a JSON file."""
    # Create a serializable copy of the stats
    data_copy = {
        'commit_data': {},
        'branch_data': branch_data,
        'code_stats': code_stats,
        'summary_stats': {},
        'aggregate_stats': {}
    }
    
    # Convert datetime objects to strings in commit data
    for repo, commits in commit_data.items():
        data_copy['commit_data'][repo] = []
        for commit in commits:
            commit_copy = commit.copy()
            commit_copy['author_date'] = commit['author_date'].isoformat() if isinstance(commit['author_date'], datetime.datetime) else str(commit['author_date'])
            commit_copy['commit_date'] = commit['commit_date'].isoformat() if isinstance(commit['commit_date'], datetime.datetime) else str(commit['commit_date'])
            data_copy['commit_data'][repo].append(commit_copy)
    
    # Convert datetime objects in summary stats
    for repo, stats in summary_stats.items():
        data_copy['summary_stats'][repo] = {}
        for key, value in stats.items():
            if isinstance(value, datetime.datetime):
                data_copy['summary_stats'][repo][key] = value.isoformat()
            elif isinstance(value, datetime.timedelta):
                data_copy['summary_stats'][repo][key] = value.total_seconds()
            else:
                data_copy['summary_stats'][repo][key] = value
    
    # Convert datetime objects in aggregate stats
    for key, value in aggregate_stats.items():
        if isinstance(value, datetime.datetime):
            data_copy['aggregate_stats'][key] = value.isoformat()
        elif isinstance(value, datetime.timedelta):
            data_copy['aggregate_stats'][key] = value.total_seconds()
        else:
            data_copy['aggregate_stats'][key] = value
    
    # Save to file
    with open(output_file, 'w') as f:
        json.dump(data_copy, f, indent=2)
    
    return output_file

def analyze_repos(repos, output_dir="."):
    os.makedirs(output_dir, exist_ok=True)
    commit_data = {}
    branch_data = {}
    code_stats = {}
    summary_stats = {}
    
    for i, (repo_name, repo_path) in enumerate(repos, 1):
        print(f"[{i}/{len(repos)}] Analyzing {repo_name}...")
        start_time = time.time()
        
        print(f"  - Getting commit history...")
        commits = get_commit_history(repo_name, repo_path)
        commit_data[repo_name] = commits
        print(f"    Found {len(commits)} commits")
        
        print(f"  - Getting branch information...")
        branches = get_branch_info(repo_name, repo_path)
        branch_data[repo_name] = branches
        print(f"    Found {len(branches)} branches")
        
        print(f"  - Getting code statistics...")
        stats = get_code_stats(repo_name, repo_path, commits)  # Pass commits here
        code_stats[repo_name] = stats
        print(f"    Found {stats.get('file_count', 0)} files with {stats.get('total_lines', 0)} lines")
        
        summary_stats[repo_name] = calculate_repo_summary(repo_name, commits, branches, stats)
        
        elapsed_time = time.time() - start_time
        print(f"  Completed in {elapsed_time:.2f} seconds\n")
    
    print("Calculating aggregate statistics...")
    aggregate_stats = calculate_aggregate_stats(summary_stats)
    
    data_file = save_data(commit_data, branch_data, code_stats, summary_stats, aggregate_stats, os.path.join(output_dir, "repo_data.json"))
    print(f"\nData collection complete! Raw data saved to: {data_file}")
    
    return {
        'commit_data': commit_data,
        'branch_data': branch_data,
        'code_stats': code_stats,
        'summary_stats': summary_stats,
        'aggregate_stats': aggregate_stats,
        'data_file': data_file
    }

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Analyze Git repositories recursively in a directory structure."
    )
    parser.add_argument(
        '--dir',
        help='Base directory to search for repositories',
        default='.',
    )
    parser.add_argument(
        '--output',
        help='Output directory for reports and visualizations',
        default='./repo_analysis',
    )
    parser.add_argument(
        '--yes', '-y',
        action='store_true',
        help='Skip confirmation and proceed with all repositories found',
    )
    parser.add_argument(
        '--recursive', '-r',
        action='store_true',
        help='Search for repositories recursively, including nested repositories',
    )
    parser.add_argument(
        '--no-reports',
        action='store_true',
        help='Skip report generation, only collect and save data',
    )
    
    return parser.parse_args()


def main():
    """Main entry point for the script."""
    args = parse_arguments()
    
    print(f"\nRepository Analyzer")
    print(f"===================")
    print(f"Searching for Git repositories in: {args.dir}")
    if args.recursive:
        print("Recursive search enabled - will find repositories inside repositories")
    
    # Find repositories
    repos = find_git_repos(args.dir, args.recursive)
    
    if not repos:
        print(f"No Git repositories found in {args.dir}.")
        return
    
    # Display found repositories and confirm proceeding
    if args.yes or confirm_repos(repos):
        # Run analysis to collect data
        data = analyze_repos(repos, args.output)
        
        # Generate reports if not disabled
        if not args.no_reports:
            try:
                # Import visualization module
                from repo_visualizer import generate_reports
                print("\nGenerating reports and visualizations...")
                report_files = generate_reports(data, args.output)
                
                print("\nReports generated successfully:")
                for report_type, file_path in report_files.items():
                    print(f"  - {report_type}: {file_path}")
                    
            except ImportError:
                print("\nWarning: repo_visualizer module not found. Reports and visualizations were not generated.")
                print("You can install it or run the visualization separately:")
                print(f"  python repo_visualizer.py --data {data['data_file']} --output {args.output}")
    else:
        print("Analysis cancelled.")


if __name__ == "__main__":
    main()
