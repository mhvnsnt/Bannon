#!/bin/bash
export OLLAMA_ORIGINS="*"
export OLLAMA_HOST="0.0.0.0:11434"

# Start ollama serve in background if not already running
# ollama serve &

echo "[NEXUS] Pulling semantic embedding model..."
ollama pull nomic-embed-text

echo "[NEXUS] Building Bannon custom model..."
if [ -f "./Bannon.Modelfile" ]; then
  # Fix model name first
  sed -i 's/qwen2.5-coder:14b/qwen2.5-coder:1.5b/g' ./Bannon.Modelfile
  ollama create bannon-nexus -f ./Bannon.Modelfile
  echo "[NEXUS] bannon-nexus model created"
fi

echo "[NEXUS] Setup complete."
