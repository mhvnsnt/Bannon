#!/bin/bash
echo "Setting up Cloudflare Tunnel (cloudflared)..."
if ! command -v cloudflared &> /dev/null
then
    echo "cloudflared not found. Installing..."
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    rm cloudflared.deb
fi

echo "cloudflared installed."
echo "To authenticate, run: cloudflared tunnel login"
echo "To create a tunnel, run: cloudflared tunnel create godmode-os"
echo "To route traffic to your local server on port 3000, run:"
echo "cloudflared tunnel route dns godmode-os godmode.yourdomain.com"
echo "cloudflared tunnel run godmode-os --url http://localhost:3000"

