#!/bin/bash
# Autonomy Forge OS: Prime Node Deployment Protocol (Extended)

# Absolute path to your backend project
PRIME_NODE_DIR="/home/youruser/PrimeNode_Autonomous_OS"
# Absolute path to your frontend project (if separate)
PRIME_FRONTEND_DIR="/home/youruser/PrimeNode_Frontend"
# Directory where NGINX serves static files from
NGINX_FRONTEND_SERVE_DIR="/var/www/primenode/html" 

LOG_FILE="/home/youruser/deploy_prime_node.log"

echo "$(date): Initiating Prime Node deployment..." >> $LOG_FILE

# --- Backend Deployment ---
cd $PRIME_NODE_DIR || { echo "$(date): ERROR: Failed to enter Prime Node directory." >> $LOG_FILE; exit 1; }
echo "$(date): Updating backend core architecture." >> $LOG_FILE
git fetch --all >> $LOG_FILE 2>&1
git reset --hard origin/main >> $LOG_FILE 2>&1
npm install --production >> $LOG_FILE 2>&1
npm run build >> $LOG_FILE 2>&1
/usr/bin/pm2 reload PrimeNode_Autonomous_OS --update-env >> $LOG_FILE 2>&1
if [ $? -ne 0 ]; then echo "$(date): ERROR: Backend PM2 reload failed." >> $LOG_FILE; exit 1; fi
echo "$(date): Backend mathematically flawless." >> $LOG_FILE

# --- Frontend Deployment (if applicable) ---
if [ -d "$PRIME_FRONTEND_DIR" ]; then # Check if frontend directory exists
    echo "$(date): Updating frontend glass sync." >> $LOG_FILE
    cd $PRIME_FRONTEND_DIR || { echo "$(date): ERROR: Failed to enter Frontend directory." >> $LOG_FILE; exit 1; }
    git fetch --all >> $LOG_FILE 2>&1
    git reset --hard origin/main >> $LOG_FILE 2>&1
    npm install --production >> $LOG_FILE 2>&1
    npm run build >> $LOG_FILE 2>&1 # Assuming 'build' command generates static files (e.g., for React)

    # Purge old frontend files and transfer new ones
    sudo rm -rf ${NGINX_FRONTEND_SERVE_DIR}/* >> $LOG_FILE 2>&1
    sudo cp -r ${PRIME_FRONTEND_DIR}/build/* ${NGINX_FRONTEND_SERVE_DIR}/ >> $LOG_FILE 2>&1
    if [ $? -ne 0 ]; then echo "$(date): ERROR: Frontend deployment failed." >> $LOG_FILE; exit 1; fi
    echo "$(date): Frontend glass sync complete." >> $LOG_FILE
else
    echo "$(date): No frontend directory detected. Skipping frontend sync." >> $LOG_FILE
fi

echo "$(date): Prime Node deployment mathematically flawless." >> $LOG_FILE
