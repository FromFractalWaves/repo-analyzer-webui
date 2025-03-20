#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==== Repo Analyzer WebUI Installer ====${NC}"
echo -e "This script will install all dependencies and set up the application."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js before continuing.${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm is not installed. Installing pnpm...${NC}"
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install pnpm. Please install it manually.${NC}"
        exit 1
    fi
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 before continuing.${NC}"
    exit 1
fi

# Create a Python virtual environment
echo -e "${GREEN}Creating Python virtual environment...${NC}"
python3 -m venv backend
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create Python virtual environment. Please install python3-venv package.${NC}"
    exit 1
fi

# Activate the virtual environment
source backend/bin/activate

# Install backend dependencies
echo -e "${GREEN}Installing backend dependencies...${NC}"
pip install -r backend/requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies.${NC}"
    exit 1
fi

# Make repo_analyzer.py executable
echo -e "${GREEN}Making repo_analyzer.py executable...${NC}"
chmod +x backend/repo_analyzer.py

# Install frontend dependencies
echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd frontend
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies.${NC}"
    exit 1
fi

# Add additional packages
echo -e "${GREEN}Installing additional frontend packages...${NC}"
pnpm add date-fns zustand
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install additional frontend packages.${NC}"
    exit 1
fi

# Return to root directory
cd ..

echo -e "${GREEN}Installation completed successfully!${NC}"
echo -e "You can now run the application using: ${YELLOW}./run.sh${NC}"