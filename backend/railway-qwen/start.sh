#!/bin/sh

# Start the Ollama server in the background
ollama serve &
PID=$!

# Wait for the server to be available
echo "Waiting for Ollama server to start..."
sleep 5

# Pull the requested abliterated models
echo "Pulling Qwen2.5-Coder-Abliterated model..."
ollama pull huihui_ai/qwen2.5-coder-abliterate:7b

echo "Pulling Qwable 5 Abliterated model..."
ollama pull qwable/qwable-5-abliterated:latest

# Wait for the server process to keep the container running
wait $PID
