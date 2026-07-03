# BANNON Forge — GPU model server (prompt -> rigged GLB).
# Default image runs the CPU `stub` backend (boots anywhere, proves the contract).
# For real generation, use a CUDA base + install the backend's deps (see requirements.txt)
# and set FORGE_BACKEND=hunyuan|trellis, FORGE_RIG=1.
#
# Real-GPU base (uncomment for Modal/RunPod/GPU box):
#   FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04
FROM python:3.11-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" "pydantic>=2"
# For GPU backends also: RUN pip install -r requirements.txt + the model repos (see file).
COPY app.py .

ENV FORGE_BACKEND=stub FORGE_RIG=0 PORT=8080
EXPOSE 8080
CMD ["python", "app.py"]
