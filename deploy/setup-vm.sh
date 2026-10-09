#!/usr/bin/env bash
# setup-vm.sh — ONE-TIME setup for the Oracle Cloud Always Free VM.
# Run this once over SSH on a fresh Ubuntu 22.04/24.04 Ampere instance:
#   curl -fsSL https://raw.githubusercontent.com/mhvnsnt/Bannon/main/deploy/setup-vm.sh | bash
set -euo pipefail

echo "==> Installing Node.js 20 (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git curl

echo "==> Installing pm2 (process manager, restart-always)"
sudo npm i -g pm2

echo "==> Cloning Bannon repo"
if [ ! -d "$HOME/bannon/.git" ]; then
  git clone https://github.com/mhvnsnt/Bannon.git "$HOME/bannon"
fi

echo "==> Configuring pm2 to survive reboots"
pm2 startup systemd -u "$USER" --hp "$HOME" || true

echo ""
echo "=============================================================="
echo " NEXT STEPS (do these once):"
echo " 1. Run the sudo command printed above by 'pm2 startup'."
echo " 2. Create $HOME/bannon/godmode/.env with your secrets:"
echo "      TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID,"
echo "      OPENAI_API_KEY, GOOGLE_GENAI_API_KEY,"
echo "      Firebase credentials, STRIPE_SECRET_KEY"
echo " 3. Open firewall ports: TCP 22 (SSH) and TCP 8080 (app)"
echo "    - Oracle console: VCN -> Security List -> Ingress rules"
echo "    - On the VM: sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT"
echo " 4. Add GitHub repo secrets (Settings -> Secrets -> Actions):"
echo "      SSH_HOST         = this VM's public IP"
echo "      SSH_USERNAME     = ubuntu"
echo "      SSH_PRIVATE_KEY  = your SSH private key"
echo " 5. Push to main — the deploy workflow takes it from here."
echo "=============================================================="
