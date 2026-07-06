FROM ubuntu:22.04

# Install Blender and Node.js
RUN apt-get update && \
    apt-get install -y \
    blender \
    curl \
    python3-pip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Run the microservice queue worker
CMD ["node", "worker.js"]
