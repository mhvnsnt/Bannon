# docker_test_sandbox.py - Automated Containerized Physics Profiler
import os
import subprocess
import json
import socket
import re

class BannonContainerSandbox:
    def __init__(self, target_bin="dist/bannon_engine", node_ipc_port=6000):
        self.target_bin = target_bin
        self.node_ipc_port = node_ipc_port
        self.container_name = "bannon_runtime_sandbox"

    def build_test_container(self):
        """Constructs a local headless container image packed with required graphics libraries."""
        dockerfile_content = """
        FROM ubuntu:24.04
        RUN apt-get update && apt-get install -y \\
            libvulkan1 \\
            vulkan-tools \\
            mesa-vulkan-drivers \\
            xorg \\
            && apt-get clean
        WORKDIR /app
        """
        with open("Dockerfile.sandbox", "w") as f:
            f.write(dockerfile_content.strip())
        
        print("[Container System] Building headless physics runtime image...")
        subprocess.run(["docker", "build", "-f", "Dockerfile.sandbox", "-t", "bannon_sandbox:latest", "."], stdout=subprocess.DEVNULL)

    def execute_headless_telemetry_run(self, duration_frames=1800):
        """Runs the game at max speed inside the container, tracking matrix drifts and clipping frames."""
        print(f"[Container System] Spawning containerized instance to profile {duration_frames} physics frames...")
        
        # Launching container with pass-through access to local GPU drivers for hardware math acceleration
        cmd = [
            "docker", "run", "--rm",
            "--device", "/dev/dri",
            "--group-add", "video",
            "-v", f"{os.path.abspath('./public/library')}:/app",
            "bannon_sandbox:latest",
            "bash", "-c", f"./{self.target_bin} --headless --frames {duration_frames} --trace-physics"
        ]
        
        try:
            process = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if process.returncode == 0:
                # Parse metrics piped from your custom engine's telemetry flag
                telemetry_data = self._parse_engine_output(process.stdout)
                return {"status": "STABLE", "metrics": telemetry_data}
            else:
                self._notify_ipc_error("MACRO_PHYSICS_CRASH", process.stderr)
                return {"status": "CRASHED", "logs": process.stderr}
                
        except subprocess.TimeoutExpired:
            self._notify_ipc_error("INFINITE_LOOP_FREEZE", "Physics iteration failed to step forward within time limits.")
            return {"status": "TIMEOUT", "logs": "Thread deadlock caught."}

    def _parse_engine_output(self, stdout):
        """Extracts tracking parameters to catch micro-bugs before they cause visual glitches."""
        nan_checks = re.findall(r"NaN detected", stdout)
        clipping_events = re.findall(r"Collision overlap matrix delta > threshold", stdout)
        
        return {
            "floating_point_errors": len(nan_checks),
            "mesh_clipping_events": len(clipping_events)
        }

    def _notify_ipc_error(self, error_type, details):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", self.node_ipc_port))
            s.send(json.dumps({
                "jsonrpc": "2.0", 
                "method": "ast/telemetry", 
                "params": {"file": "ContainerSandbox", "status": error_type, "iterations": details[:250]}
            }).encode('utf-8'))
            s.close()
        except Exception:
            pass

if __name__ == "__main__":
    sandbox = BannonContainerSandbox()
    sandbox.build_test_container()
