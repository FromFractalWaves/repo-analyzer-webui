#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==== Repo Analyzer WebUI ====${NC}"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${YELLOW}tmux is not installed. Running services in separate terminals.${NC}"
    USE_TMUX=false
else
    USE_TMUX=true
fi

# Function to start backend
start_backend() {
    echo -e "${BLUE}Starting backend server...${NC}"
    # Activate the virtual environment
    source backend/bin/activate
    # Run the backend server
    cd backend
    python -m app.main
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}Starting frontend server...${NC}"
    # Run the frontend server
    cd frontend
    pnpm dev
}

# Use tmux if available
if [ "$USE_TMUX" = true ]; then
    # Check if a session already exists
    tmux has-session -t repo-analyzer 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}A tmux session named 'repo-analyzer' already exists. Attaching to it...${NC}"
        tmux attach-session -t repo-analyzer
    else
        echo -e "${GREEN}Creating new tmux session...${NC}"
        tmux new-session -d -s repo-analyzer
        
        # Create windows for backend and frontend
        tmux rename-window -t repo-analyzer "backend"
        tmux send-keys -t repo-analyzer "cd $(pwd) && source backend/bin/activate && cd backend && python -m app.main" C-m
        
        tmux new-window -t repo-analyzer -n "frontend"
        tmux send-keys -t repo-analyzer:frontend "cd $(pwd)/frontend && pnpm dev" C-m
        
        # Attach to the session
        tmux attach-session -t repo-analyzer
    fi
else
    # Start services in background
    echo -e "${YELLOW}Starting services in separate processes...${NC}"
    echo -e "${YELLOW}Use Ctrl+C to stop all services when done.${NC}"
    
    # Start backend in background
    (start_backend) &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 5
    
    # Start frontend in background
    (start_frontend) &
    FRONTEND_PID=$!
    
    # Handle clean shutdown
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
    wait
fi