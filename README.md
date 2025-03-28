# Repo Analyzer WebUI

A modern web interface for analyzing Git repositories, providing insights and visualizations for repository data.

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

Repo Analyzer WebUI is a full-stack application for discovering, managing, and analyzing Git repositories. The application provides a rich set of features for exploring repository metrics, visualizing commit history, and understanding code patterns.

## Features

- **Repository Management**
  - Discover Git repositories in your filesystem
  - Save and organize repositories with tags
  - Favorite repositories for quick access
  - Search and filter repositories with command palette interface

- **Analysis Features**
  - Run deep analysis on Git repositories
  - Track analysis jobs with live status updates
  - View detailed metrics and visualizations
  - Export analysis reports in various formats

- **Rich Visualizations**
  - Commit activity timeline
  - Author contribution statistics
  - Code distribution by file type
  - Commit word clouds and heatmaps
  - Branch overview

- **Modern UI**
  - Responsive design for desktop and mobile
  - Dark and light theme support with system preference detection
  - Command palette for quick navigation
  - Interactive dashboards
  - Markdown report rendering

## Architecture Overview

The application uses a modern full-stack architecture with clear separation of concerns:

### Backend (Python FastAPI)
- RESTful API for repository management, analysis jobs, and data retrieval
- SQLite database for persistent storage of repositories and analysis results
- Background job processing for repository analysis
- Filesystem access for repository discovery and Git operations
- Report generation in multiple formats (Markdown, HTML, JSON)

### Frontend (Next.js + React)
- Component-driven UI architecture with Shadcn UI components
- Context API for global state management
- Zustand stores for repository and analysis data
- Command palette for efficient navigation and operations
- Data visualization components using Recharts

## Technology Stack

### Frontend
- Next.js for the React framework
- Tailwind CSS for styling
- Shadcn UI components
- React Context API and Zustand for state management
- Recharts for data visualization

### Backend
- FastAPI (Python)
- SQLite for data storage
- Git integration via Python's subprocess
- Background job processing
- Pydantic for data validation

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Git
- pnpm (will be installed if not present)

### Installation

You can install the application using the provided installation script or follow the manual steps.

#### Automated Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/repo-analyzer.git
   cd repo-analyzer
   ```

2. Make the installation script executable
   ```
   chmod +x installer.sh
   ```

3. Run the installation script
   ```
   ./installer.sh
   ```

The script will:
- Check for required dependencies (Node.js, Python 3)
- Install pnpm if not present
- Create a Python virtual environment
- Install backend dependencies
- Install frontend dependencies
- Set up necessary permissions

#### Manual Setup

If you prefer to install manually:

##### Backend Setup

1. Create a Python virtual environment
   ```
   python -m venv backend
   source backend/bin/activate  # On Windows: backend\Scripts\activate
   ```

2. Install Python dependencies
   ```
   pip install -r backend/requirements.txt
   ```

3. Make repository analyzer executable
   ```
   chmod +x backend/repo_analyzer.py
   ```

##### Frontend Setup

1. Navigate to the frontend directory
   ```
   cd frontend
   ```

2. Install dependencies (using pnpm)
   ```
   pnpm install
   pnpm add date-fns zustand
   ```

### Running the Application

The application uses both a backend and frontend server. You can use the provided run script or follow the manual steps.

#### Using the Run Script

1. Make the run script executable
   ```
   chmod +x run.sh
   ```

2. Start both servers
   ```
   ./run.sh
   ```

The script will:
- Start the backend server (FastAPI) on port 8000
- Start the frontend server (Next.js) on port 3000
- Use tmux (if available) to manage both servers in a single terminal window
- Allow easy shutdown with Ctrl+C

#### Manual Startup

Start Backend:
```
source backend/bin/activate
cd backend
python -m app.main
```

Start Frontend (in a different terminal):
```
cd frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Discovering Repositories

1. Navigate to the "Discover" tab
2. Click "Browse Directories" to select a location on your filesystem
3. Click "Discover Repositories" to find Git repositories in that location
4. Select repositories to add to your collection

### Running Analysis

1. Select a repository from your collection
2. Click "Analyze Repository"
3. Monitor the analysis job in the "Jobs" tab
4. View detailed results in the "Results" tab when the analysis completes

### Viewing Visualizations

1. From the analysis results, explore various visualizations:
   - Commit Activity
   - Author Statistics
   - Code Distribution
   - Commit Word Cloud
   - and more

### Exporting Reports

1. View the analysis report in the "Results" tab
2. Choose your preferred export format (Markdown, HTML, JSON)
3. Download the report for sharing or further processing

## Core Components

### Backend Components

- **API Routes (`backend/app/api/routes.py`)**: 
  Defines all RESTful endpoints for repository management, analysis jobs, and data retrieval.

- **Database Module (`backend/app/db/database.py`)**: 
  Manages SQLite database connections and defines the database schema.

- **Job Manager (`backend/app/services/job_manager.py`)**: 
  Handles creating, tracking, and executing repository analysis jobs.

- **Repository Service (`backend/app/services/repository_service.py`)**: 
  Provides functionality for managing repository metadata and searching repositories.

- **Analysis Service (`backend/app/services/analysis.py`)**:  
  Core analysis logic that generates insights from Git repositories.

- **Simplified Repo Analyzer (`backend/app/services/simplified_repo_analyzer.py`)**: 
  Streamlined version of the analyzer that processes Git data.

### Frontend Components

- **Repository Management (`frontend/components/repository/`)**: 
  Components for discovering, adding, and managing Git repositories.

- **Command Manager (`frontend/components/command-manager/`)**: 
  Implements the command palette interface for quick actions and navigation.

- **Visualizations (`frontend/components/visualizations/`)**: 
  Components for rendering various charts and visualizations of repository data.

- **Context Providers (`frontend/context/`)**: 
  Application-wide state management through React Context API.

- **API Service (`frontend/services/api/`)**: 
  Client-side API integration with the backend.

- **Repository Store (`frontend/store/useRepositoryStore.ts`)**: 
  Zustand store for managing repository state across the application.

## Development

### Project Structure

```
repo-analyzer/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── db/           # Database models and connection
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── config.py     # Configuration
│   ├── data/             # SQLite database files
│   └── reports/          # Generated reports
├── frontend/
│   ├── app/              # Next.js pages and layout
│   ├── components/
│   │   ├── command-manager/ # Command palette functionality
│   │   ├── repository/      # Repository management components
│   │   ├── ui/              # Reusable UI components
│   │   └── visualizations/  # Data visualization components
│   ├── context/          # React context providers
│   ├── services/         # API client
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── installer.sh          # Installation script
└── run.sh                # Application startup script
```

### Helper Scripts

The application includes two utility scripts to simplify the development workflow:

#### installer.sh

The installation script automates setting up the development environment. It handles installing all dependencies for both the backend and frontend, creating the Python virtual environment, and configuring necessary permissions.

Key features:
- Checks for and installs dependencies automatically
- Creates a Python virtual environment
- Installs backend Python dependencies
- Sets up the frontend with pnpm
- Makes necessary files executable

To use it:
```bash
chmod +x installer.sh
./installer.sh
```

#### run.sh

The run script manages starting both the backend and frontend servers simultaneously. It detects whether tmux is available and uses it to create a clean development environment with separate panes for each server, or falls back to starting processes in the background.

Key features:
- Starts both backend and frontend in a single command
- Uses tmux if available for a better development experience
- Falls back to background processes if tmux isn't installed
- Handles proper shutdown of all processes with Ctrl+C

To use it:
```bash
chmod +x run.sh
./run.sh
```

If you have tmux installed, you can:
- `Ctrl+B` then `0` - Switch to backend server
- `Ctrl+B` then `1` - Switch to frontend server
- `Ctrl+B` then `D` - Detach from session (servers keep running)
- `tmux attach -t repo-analyzer` - Reattach to session

### Adding New Features

- For new visualizations, add components to `frontend/components/visualizations/`
- For new API endpoints, update both `backend/app/api/routes.py` and `frontend/services/api/index.ts`
- For additional repository metrics, modify `backend/app/services/simplified_repo_analyzer.py`

## Performance Considerations

- The backend uses asynchronous request handling with FastAPI
- Background jobs for long-running repository analysis operations
- SQLite database with indexes for efficient repository filtering
- Client-side state management to minimize API requests
- Optimized visualizations for large repositories

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [Next.js](https://nextjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn UI](https://ui.shadcn.com/) for UI components
- [Recharts](https://recharts.org/) for data visualizations
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [tmux](https://github.com/tmux/tmux) for terminal multiplexing