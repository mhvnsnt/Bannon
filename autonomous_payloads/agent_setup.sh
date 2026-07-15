#!/bin/bash
echo "Updating system..."
pkg update && pkg upgrade -y
echo "Installing dependencies..."
pkg install python python-pip nodejs -y
pip install aider-chat letta
npm install -g repomix
echo "Installation complete."
