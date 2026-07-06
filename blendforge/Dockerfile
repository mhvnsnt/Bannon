# Headless Blender 4.x Microservice Dockerfile
FROM python:3.10-slim

# Install system dependencies for headless Blender, Node, and Python libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    xz-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxi6 \
    libxrender1 \
    libxxf86vm1 \
    libxkbcommon0 \
    libsm6 \
    libice6 \
    xvfb \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (v18) for the BullMQ worker
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Download and install Blender 4.1.1 Headless Linux binary
WORKDIR /opt
RUN curl -o blender.tar.xz -L "https://download.blender.org/release/Blender4.1/blender-4.1.1-linux-x64.tar.xz" \
    && tar -xf blender.tar.xz \
    && mv blender-4.1.1-linux-x64 blender \
    && rm blender.tar.xz \
    && ln -s /opt/blender/blender /usr/local/bin/blender

# Set up work directory for the microservice
WORKDIR /app

# Copy service files
COPY package.json worker.js convert.py ./

# Install Node.js dependencies
RUN npm install

# Command to boot the BullMQ headless pipeline worker
CMD ["node", "worker.js"]
