#!/usr/bin/env python3
"""
repo_visualizer.py: Generate reports and visualizations from repository data.

This script takes the data collected by repo_analyzer.py and generates
various reports and visualizations.

Usage:
    python repo_visualizer.py --data /path/to/repo_data.json --output /path/to/output_dir
"""

import os
import sys
import argparse
import json
import datetime
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from dateutil.parser import parse


def load_data(data_file):
    """Load data from a JSON file and convert date strings to datetime objects."""
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    # Convert string dates back to datetime objects
    for repo, commits in data['commit_data'].items():
        for commit in commits:
            try:
                commit['author_date'] = parse(commit['author_date'])
                commit['commit_date'] = parse(commit['commit_date'])
            except:
                pass
    
    # Convert dates in summary stats
    for repo, repo_stats in data['summary_stats'].items():
        for key in ['first_commit', 'last_commit', 'peak_pace_start', 'peak_pace_end']:
            if key in repo_stats and isinstance(repo_stats[key], str):
                try:
                    repo_stats[key] = parse(repo_stats[key])
                except:
                    pass
    
    # Convert dates in aggregate stats
    for key in ['first_commit', 'last_commit']:
        if key in data['aggregate_stats'] and isinstance(data['aggregate_stats'][key], str):
            try:
                data['aggregate_stats'][key] = parse(data['aggregate_stats'][key])
            except:
                pass
    
    return data


def generate_commit_timeline(commit_data, output_file="commit_timeline.png"):
    """Generate a timeline visualization of commits across all repositories."""
    plt.figure(figsize=(12, 8))
    
    # Create a DataFrame with commit dates
    all_commits = []
    for repo, commits in commit_data.items():
        for commit in commits:
            all_commits.append({
                'repo': repo,
                'date': commit['commit_date'],
                'message': commit['message']
            })
    
    if not all_commits:
        print("No commit data to visualize")
        return None
    
    df = pd.DataFrame(all_commits)
    
    # Ensure the date column is datetime
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Group by repo and date (day)
    df['day'] = df['date'].dt.floor('D')
    commits_by_day = df.groupby(['repo', 'day']).size().reset_index(name='count')
    
    # Pivot for plotting
    pivot = commits_by_day.pivot(index='day', columns='repo', values='count').fillna(0)
    
    # Plot stacked bar chart
    ax = pivot.plot(kind='bar', stacked=True, figsize=(15, 8))
    plt.title('Commits by Day Across Repositories')
    plt.xlabel('Date')
    plt.ylabel('Number of Commits')
    plt.tight_layout()
    plt.savefig(output_file)
    plt.close()
    
    return output_file


def generate_commit_heatmap(commit_data, output_file="commit_heatmap.png"):
    """Generate a heatmap of commit activity by hour and day of week."""
    plt.figure(figsize=(12, 8))
    
    # Create a DataFrame with commit dates
    all_commits = []
    for repo, commits in commit_data.items():
        for commit in commits:
            all_commits.append({
                'repo': repo,
                'date': commit['commit_date'],
                'message': commit['message']
            })
    
    if not all_commits:
        print("No commit data to visualize")
        return None
    
    df = pd.DataFrame(all_commits)
    
    # Ensure the date column is datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Extract hour and day of week
    df['hour'] = df['date'].dt.hour
    df['day_of_week'] = df['date'].dt.day_name()
    
    # Ensure day of week is ordered properly
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    df['day_of_week'] = pd.Categorical(df['day_of_week'], categories=day_order, ordered=True)
    
    # Group by hour and day of week
    heatmap_data = df.groupby(['day_of_week', 'hour']).size().unstack().fillna(0)
    
    # Plot heatmap
    plt.figure(figsize=(15, 8))
    sns.heatmap(heatmap_data, cmap='viridis', annot=True, fmt='g')
    plt.title('Commit Activity by Hour and Day of Week')
    plt.xlabel('Hour of Day')
    plt.ylabel('Day of Week')
    plt.tight_layout()
    plt.savefig(output_file)
    plt.close()
    
    return output_file


def generate_repo_comparison(summary_stats, output_file="repo_comparison.png"):
    """Generate a bar chart comparing repositories by commits, branches, and lines."""
    # Extract data
    data = []
    for repo, stats in summary_stats.items():
        data.append({
            'repo': repo,
            'commits': stats.get('num_commits', 0),
            'branches': stats.get('num_branches', 0),
            'lines': stats.get('total_lines', 0),
            'commits_per_day': stats.get('commits_per_day', 0)
        })
    
    df = pd.DataFrame(data)
    
    # Set up the figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # Plot commits
    sns.barplot(x='repo', y='commits', data=df, ax=axes[0, 0], palette='viridis')
    axes[0, 0].set_title('Number of Commits by Repository')
    axes[0, 0].set_xlabel('Repository')
    axes[0, 0].set_ylabel('Commits')
    axes[0, 0].tick_params(axis='x', rotation=45)
    
    # Plot branches
    sns.barplot(x='repo', y='branches', data=df, ax=axes[0, 1], palette='magma')
    axes[0, 1].set_title('Number of Branches by Repository')
    axes[0, 1].set_xlabel('Repository')
    axes[0, 1].set_ylabel('Branches')
    axes[0, 1].tick_params(axis='x', rotation=45)
    
    # Plot lines
    sns.barplot(x='repo', y='lines', data=df, ax=axes[1, 0], palette='plasma')
    axes[1, 0].set_title('Lines of Code by Repository')
    axes[1, 0].set_xlabel('Repository')
    axes[1, 0].set_ylabel('Lines')
    axes[1, 0].tick_params(axis='x', rotation=45)
    
    # Plot commits per day
    sns.barplot(x='repo', y='commits_per_day', data=df, ax=axes[1, 1], palette='crest')
    axes[1, 1].set_title('Commits per Day by Repository')
    axes[1, 1].set_xlabel('Repository')
    axes[1, 1].set_ylabel('Commits per Day')
    axes[1, 1].tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig(output_file)
    plt.close()
    
    return output_file

def generate_lines_by_repo(summary_stats, output_file="lines_by_repo.png"):
    """Generate a bar chart showing lines of code by repository."""
    repos = list(summary_stats.keys())
    lines = [summary_stats[repo]['total_lines'] for repo in repos]
    
    plt.figure(figsize=(12, 8))
    bars = plt.bar(repos, lines, color='skyblue')
    
    # Add the text labels
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,}',
                ha='center', va='bottom', rotation=0)
    
    plt.title('Lines of Code by Repository')
    plt.xlabel('Repository')
    plt.ylabel('Lines of Code')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    plt.savefig(output_file)
    plt.close()
    
    return output_file


def generate_velocity_chart(commit_data, output_file="velocity_chart.png"):
    """Generate a line chart showing commit velocity over time."""
    # Create a DataFrame with commit dates
    all_commits = []
    for repo, commits in commit_data.items():
        for commit in commits:
            all_commits.append({
                'repo': repo,
                'date': commit['commit_date']
            })
    
    if not all_commits:
        print("No commit data to visualize")
        return None
    
    df = pd.DataFrame(all_commits)
    
    # Ensure the date column is datetime
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Group by date (day)
    df['day'] = df['date'].dt.floor('D')
    
    # Calculate rolling average (7-day window)
    daily_counts = df.groupby('day').size().reset_index(name='count')
    daily_counts.set_index('day', inplace=True)
    
    # Ensure we have a continuous date range
    if len(daily_counts) > 1:
        date_range = pd.date_range(start=daily_counts.index.min(), end=daily_counts.index.max())
        daily_counts = daily_counts.reindex(date_range, fill_value=0)
    
    # Calculate rolling averages
    if len(daily_counts) >= 7:
        daily_counts['7d_avg'] = daily_counts['count'].rolling(window=7, min_periods=1).mean()
    else:
        daily_counts['7d_avg'] = daily_counts['count']
    
    # Plot
    plt.figure(figsize=(15, 8))
    
    # Plot daily commits as bars
    plt.bar(daily_counts.index, daily_counts['count'], alpha=0.5, color='skyblue', width=0.8)
    
    # Plot rolling average as line
    plt.plot(daily_counts.index, daily_counts['7d_avg'], color='darkblue', linewidth=2)
    
    plt.title('Commit Velocity Over Time')
    plt.xlabel('Date')
    plt.ylabel('Number of Commits')
    plt.grid(True, alpha=0.3)
    
    # Format the x-axis to show dates nicely
    plt.gcf().autofmt_xdate()
    
    plt.tight_layout()
    plt.savefig(output_file)
    plt.close()
    
    return output_file


def generate_report(summary_stats, aggregate_stats, output_file="repo_analysis_report.md"):
    """Generate a markdown report with analysis results."""
    # Start building the report
    report = []
    
    # Title
    report.append("# Repository Analysis Report\n")
    report.append(f"Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Overview section
    report.append("## Overview\n")
    report.append(f"- **Repositories Analyzed**: {aggregate_stats['repos_analyzed']}")
    
    if aggregate_stats.get('first_commit') and aggregate_stats.get('last_commit'):
        report.append(f"- **Time Span**: {aggregate_stats['first_commit'].strftime('%Y-%m-%d %H:%M:%S')} to {aggregate_stats['last_commit'].strftime('%Y-%m-%d %H:%M:%S')}")
        
        days = aggregate_stats['time_span'] / (24 * 60 * 60) if isinstance(aggregate_stats['time_span'], (int, float)) else aggregate_stats['time_span'].total_seconds() / (24 * 60 * 60)
        report.append(f"- **Duration**: {days:.2f} days")
    
    report.append(f"- **Total Commits**: {aggregate_stats['total_commits']}")
    report.append(f"- **Total Branches**: {aggregate_stats['total_branches']}")
    report.append(f"- **Total Lines of Code**: {aggregate_stats['total_lines']}")
    
    if aggregate_stats.get('overall_commits_per_day'):
        report.append(f"- **Average Commits per Day**: {aggregate_stats['overall_commits_per_day']:.2f}")
    
    if aggregate_stats.get('fastest_pace') and aggregate_stats.get('fastest_pace') != float('inf'):
        report.append(f"- **Fastest Commit Pace**: {aggregate_stats['fastest_pace'] / 60:.2f} minutes between commits in {aggregate_stats['fastest_pace_repo']}")
    
    report.append("\n")
    
    # Repository breakdown
    report.append("## Repository Breakdown\n")
    
    for repo, stats in summary_stats.items():
        report.append(f"### {repo}\n")
        report.append(f"- **Commits**: {stats['num_commits']}")
        report.append(f"- **Branches**: {stats['num_branches']}")
        report.append(f"- **Total Lines**: {stats['total_lines']}")
        
        if 'first_commit' in stats and 'last_commit' in stats:
            report.append(f"- **First Commit**: {stats['first_commit'].strftime('%Y-%m-%d %H:%M:%S')}")
            report.append(f"- **Last Commit**: {stats['last_commit'].strftime('%Y-%m-%d %H:%M:%S')}")
            
            days = stats['time_span'] / (24 * 60 * 60) if isinstance(stats['time_span'], (int, float)) else stats['time_span'].total_seconds() / (24 * 60 * 60)
            report.append(f"- **Time Span**: {days:.2f} days")
            
            if days > 0:
                report.append(f"- **Commits per Day**: {stats['commits_per_day']:.2f}")
        
        if 'avg_time_between_commits' in stats and stats['avg_time_between_commits'] > 0:
            avg_minutes = stats['avg_time_between_commits'] / 60
            report.append(f"- **Average Time Between Commits**: {avg_minutes:.2f} minutes")
        
        if 'peak_pace_commits' in stats:
            report.append(f"- **Peak Activity**: {stats['peak_pace_commits']} commits in {stats['peak_pace_duration'] / 60:.2f} minutes")
            report.append(f"  - From: {stats['peak_pace_start'].strftime('%Y-%m-%d %H:%M:%S')}")
            report.append(f"  - To: {stats['peak_pace_end'].strftime('%Y-%m-%d %H:%M:%S')}")
        
        if 'lines_per_commit' in stats:
            report.append(f"- **Lines per Commit**: {stats['lines_per_commit']:.2f}")
        
        # Most frequent words in commit messages
        if 'frequent_words' in stats and stats['frequent_words']:
            report.append("- **Common Words in Commit Messages**:")
            for word, count in list(stats['frequent_words'].items())[:5]:
                report.append(f"  - '{word}': {count} occurrences")
        
        report.append("\n")
    
    # Write the report
    with open(output_file, 'w') as f:
        f.write('\n'.join(report))
    
    return output_file


def create_html_report(visualizations, output_dir):
    """Create a comprehensive HTML report combining all visualizations."""
    html_report_path = os.path.join(output_dir, "repo_analysis_report.html")
    
    # Get the base paths for the visualization files
    for key, path in visualizations.items():
        if path:
            visualizations[key] = os.path.basename(path)
    
    # Create the HTML content
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository Analysis Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1, h2, h3 {{
            color: #2c3e50;
        }}
        h1 {{
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
            margin-top: 30px;
        }}
        .image-container {{
            margin: 20px 0;
            text-align: center;
        }}
        .image-container img {{
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-gap: 20px;
        }}
        @media (max-width: 768px) {{
            .grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <h1>Repository Analysis Report</h1>
    <p>Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

    <h2>Repository Overview</h2>
    <div class="grid">
        <div class="image-container">
            <h3>Commits by Repository</h3>
            <img src="{visualizations.get('repo_comparison', '')}" alt="Repository Comparison">
        </div>
        <div class="image-container">
            <h3>Lines of Code</h3>
            <img src="{visualizations.get('lines_by_repo', '')}" alt="Lines of Code by Repository">
        </div>
    </div>

    <h2>Commit Activity</h2>
    <div class="grid">
        <div class="image-container">
            <h3>Commit Timeline</h3>
            <img src="{visualizations.get('commit_timeline', '')}" alt="Commit Timeline">
        </div>
        <div class="image-container">
            <h3>Commit Velocity</h3>
            <img src="{visualizations.get('velocity_chart', '')}" alt="Commit Velocity">
        </div>
    </div>

    <h2>Work Patterns</h2>
    <div class="image-container">
        <h3>Commit Activity by Hour and Day</h3>
        <img src="{visualizations.get('commit_heatmap', '')}" alt="Commit Heatmap">
    </div>

    <h2>Detailed Analysis</h2>
    <p>For more detailed analysis, please check the following files:</p>
    <ul>
        <li><a href="repo_analysis_report.md">Repository Analysis Report (Markdown)</a></li>
        <li><a href="repo_data.json">Raw Repository Statistics (JSON)</a></li>
    </ul>
</body>
</html>
"""
    
    # Write the HTML file
    with open(html_report_path, 'w') as f:
        f.write(html_content)
    
    return html_report_path


def generate_reports(data, output_dir="."):
    """Generate all reports and visualizations from the analysis data."""
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize dict to track generated files
    report_files = {}
    
    # Extract data components
    commit_data = data.get('commit_data', {})
    branch_data = data.get('branch_data', {})
    code_stats = data.get('code_stats', {})
    summary_stats = data.get('summary_stats', {})
    aggregate_stats = data.get('aggregate_stats', {})
    
    # Create visualizations
    print("Generating visualizations...")
    visualizations = {}
    
    # Commit timeline
    timeline_file = generate_commit_timeline(commit_data, os.path.join(output_dir, "commit_timeline.png"))
    if timeline_file:
        visualizations['commit_timeline'] = timeline_file
        report_files['commit_timeline'] = timeline_file
    
    # Commit heatmap
    heatmap_file = generate_commit_heatmap(commit_data, os.path.join(output_dir, "commit_heatmap.png"))
    if heatmap_file:
        visualizations['commit_heatmap'] = heatmap_file
        report_files['commit_heatmap'] = heatmap_file
    
    # Repository comparison
    comparison_file = generate_repo_comparison(summary_stats, os.path.join(output_dir, "repo_comparison.png"))
    if comparison_file:
        visualizations['repo_comparison'] = comparison_file
        report_files['repo_comparison'] = comparison_file
    
    # Lines by repository
    lines_file = generate_lines_by_repo(summary_stats, os.path.join(output_dir, "lines_by_repo.png"))
    if lines_file:
        visualizations['lines_by_repo'] = lines_file
        report_files['lines_by_repo'] = lines_file
    
    # Velocity chart
    velocity_file = generate_velocity_chart(commit_data, os.path.join(output_dir, "velocity_chart.png"))
    if velocity_file:
        visualizations['velocity_chart'] = velocity_file
        report_files['velocity_chart'] = velocity_file
    
    # Generate report
    print("Generating markdown report...")
    report_file = generate_report(summary_stats, aggregate_stats, os.path.join(output_dir, "repo_analysis_report.md"))
    report_files['markdown_report'] = report_file
    
    # Create HTML report
    print("Generating HTML report...")
    html_report = create_html_report(visualizations, output_dir)
    report_files['html_report'] = html_report
    
    return report_files


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate reports and visualizations from repository data."
    )
    parser.add_argument(
        '--data',
        help='Path to the repository data JSON file',
        required=True,
    )
    parser.add_argument(
        '--output',
        help='Output directory for reports and visualizations',
        default='./repo_analysis',
    )
    
    return parser.parse_args()


def main():
    """Main entry point for the script."""
    args = parse_arguments()
    
    print(f"\nRepository Visualizer")
    print(f"====================")
    print(f"Loading data from: {args.data}")
    
    # Load data
    try:
        data = load_data(args.data)
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    # Generate reports
    print(f"Generating reports in: {args.output}")
    reports = generate_reports(data, args.output)
    
    print("\nReports generated successfully:")
    for report_type, file_path in reports.items():
        print(f"  - {report_type}: {file_path}")


if __name__ == "__main__":
    main()
