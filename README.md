# Repository Analyzer WebUI

this is just a placeholder. 

so heres what claude said to "can you update this for the webui version?"

## Features

- **Recursive Repository Discovery**: Automatically finds all Git repositories in a directory tree
- **Comprehensive Analytics**: Extracts commit history, branch information, and codebase statistics
- **Interactive Confirmation**: Allows you to review and confirm which repositories to analyze
- **Detailed Visualizations**: Generates graphs for commit timelines, activity patterns, and more
- **Multiple Report Formats**: Creates Markdown, JSON, and HTML reports for easy review
- **Web UI Interface**: Modern Next.js frontend for interactive repository analysis and visualization
- **Command Manager**: Simplified interface for running repository analysis operations
- **Visual Dashboard**: Interactive visualizations including commit heatmaps, timelines, and word clouds

## Versions

### CLI Version

A lightweight command-line tool for quick analysis with minimal dependencies.

### Web UI Version

A full-featured web application with interactive dashboards and enhanced visualizations.

## Installation

### Prerequisites

#### CLI Version
- Python 3.6 or higher
- Required Python packages:
  - pandas
  - matplotlib
  - seaborn
  - numpy

#### Web UI Version
- Python 3.6 or higher (for backend)
- Node.js 16+ (for frontend)
- pnpm (recommended) or npm

### Setup

#### CLI Version

1. Clone the repository or download the files:
```bash
git clone https://github.com/yourusername/repo-analyzer.git
# or just download repo_analyzer.py and analyze_repos.sh
```

2. Install required packages:
```bash
pip install pandas matplotlib seaborn numpy
```

3. Make the shell script executable:
```bash
chmod +x analyze_repos.sh
```

#### Web UI Version

1. Clone the repository:
```bash
git clone https://github.com/FromFractalWaves/repo-analyzer-webui.git
cd repo-analyzer-webui
```

2. Run the installer script:
```bash
./installer.sh
```

This will:
- Set up the Python backend environment
- Install frontend dependencies with pnpm
- Configure the database

## Usage

### CLI Version

#### Basic Usage
Run the analysis on the current directory:
```bash
./analyze_repos.sh
```

#### Specify a Directory
Analyze all repositories in a specific directory:
```bash
./analyze_repos.sh --dir ~/path/to/repos
```

#### Custom Output Location
Specify where to save the results:
```bash
./analyze_repos.sh --dir ~/path/to/repos --output ~/analysis-results
```

#### Skip Confirmation
Run non-interactively, analyzing all repositories found:
```bash
./analyze_repos.sh --dir ~/path/to/repos --yes
```

#### Python Script Directly
You can also run the Python script directly:
```bash
python3 repo_analyzer.py --dir ~/path/to/repos --output ~/analysis-results --yes
```

### Web UI Version

1. Start the application:
```bash
./run.sh
```

2. Open your browser and navigate to `http://localhost:3000`

3. Using the Web UI:
   - Use the Repository Discovery tool to scan directories for Git repositories
   - Select repositories to analyze
   - View interactive visualizations in the dashboard
   - Export reports in various formats

## Output Files

### CLI Version
The analyzer produces the following outputs:
1. **Markdown Report**: `repo_analysis_report.md` - A detailed textual analysis
2. **JSON Statistics**: `repo_stats.json` - Raw statistics in structured format
3. **HTML Report**: `repo_analysis_report.html` - Interactive report with visualizations
4. **Visualizations**:
   - `commit_timeline.png` - Timeline of commits across repositories
   - `commit_heatmap.png` - Activity patterns by hour and day of week
   - `repo_comparison.png` - Comparative metrics across repositories
   - `velocity_chart.png` - Commit velocity/frequency over time

### Web UI Version
The web interface provides:
1. **Interactive Dashboards**: Real-time data visualization and exploration
2. **Customizable Views**: Configure which metrics and charts to display
3. **Exportable Reports**: Download analysis in multiple formats
4. **Enhanced Visualizations**:
   - Commit activity heatmaps
   - Author contribution charts
   - Code distribution analysis
   - Branch overview diagrams
   - Commit word clouds
   - File extension distribution

## Examples

### CLI Example
```bash
./analyze_repos.sh --dir ~/new_world/dd/ --output ~/repo-stats
```

This will:
1. Search for all Git repositories under `~/new_world/dd/`
2. Show a list of repositories found and ask for confirmation
3. Analyze each repository and gather statistics
4. Generate reports and visualizations in `~/repo-stats/`

### Web UI Example
1. Open the application in your browser
2. Navigate to the Repository Discovery tab
3. Enter the path to scan (e.g., `~/new_world/dd/`)
4. Select repositories from the discovered list
5. Click "Analyze" to generate statistics
6. Explore the visualizations in the dashboard
7. Export results as needed

## Customization

### CLI Version
You can customize the analyzer by:
1. **Modifying the Python script** to add additional metrics or visualizations
2. **Adjusting report templates** for different output formatting
3. **Adding analysis functions** to extract specialized metrics for your projects

### Web UI Version
The web interface offers additional customization:
1. **Component-based Architecture**: Extend with new visualization components
2. **Command Plugin System**: Add new analysis commands through the plugin architecture
3. **Theming Support**: Customize the appearance through the ThemeContext
4. **API Extensions**: Extend the backend API with new analysis endpoints

## Technical Architecture

### Backend
- Python-based analysis engine
- Modular architecture with services for analysis, job management, and repository handling
- SQLite database for job and repository tracking
- RESTful API for frontend communication

### Frontend
- Next.js application with React components
- Tailwind CSS with shadcn/ui components
- State management via React context and custom hooks
- Visualization components using various charting libraries

## License

MIT License