#!/bin/bash
LOG_FILE="$HOME/bannon_install.log"
echo "--- $(date) --- Starting Bannon Setup ---" >> $LOG_FILE
pkg update && pkg upgrade -y >> $LOG_FILE 2>&1
pkg install python python-pip nodejs git tmux neovim -y >> $LOG_FILE 2>&1
pip install aider-chat letta >> $LOG_FILE 2>&1
npm install -g repomix >> $LOG_FILE 2>&1
echo "--- $(date) --- Installation Complete ---" >> $LOG_FILE
# Health Check
if command -v aider >/dev/null 2>&1 && command -v letta >/dev/null 2>&1 && command -v repomix >/dev/null 2>&1; then
  echo "--- $(date) --- All tools verified successfully ---" >> $LOG_FILE
else
  echo "--- $(date) --- Verification failed: Missing tools ---" >> $LOG_FILE
fi
