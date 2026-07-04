# daemon_sandbox.py - Runtime Execution Sandboxing & Crash Trapping
import subprocess
import os
import json
import socket

class RuntimeSandboxExecutor:
    def __init__(self, workspace_dir="./public/library", node_ipc_port=6000):
        self.workspace_dir = os.path.abspath(workspace_dir)
        self.node_ipc_port = node_ipc_port

    def execute_and_trap_exceptions(self, execution_command=["node", "dist/engine.js"], execution_timeout=5):
        """Spawns code in an OS subprocess and traps runtime unhandled crashes."""
        print(f"[Sandbox] Launching app runtime via subprocess configuration: {execution_command}")
        
        try:
            # Spawn application process inside your build directory context
            process = subprocess.run(
                execution_command,
                cwd=os.path.dirname(self.workspace_dir),
                capture_output=True,
                text=True,
                timeout=execution_timeout
            )
            
            if process.returncode == 0:
                print("[Sandbox] Runtime executed and exited cleanly with exit code 0.")
                return {"status": "STABLE_RUN", "logs": process.stdout}
            else:
                print(f"[Sandbox] Critical runtime crash caught. Exit code: {process.returncode}")
                self._notify_ipc_dashboard("RUNTIME_CRASH", process.stderr)
                return {"status": "CRASHED", "stack_trace": process.stderr}
                
        except subprocess.TimeoutExpired:
            print("[Sandbox] App engine entered an infinite loop state. Forcing termination.")
            self._notify_ipc_dashboard("INFINITE_LOOP", "Process killed due to execution timeout.")
            return {"status": "TIMEOUT_LOCKUP", "stack_trace": "Infinite loop detected inside program logic."}

    def _notify_ipc_dashboard(self, status, detailed_error):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", self.node_ipc_port))
            payload = {
                "jsonrpc": "2.0",
                "method": "ast/telemetry",
                "params": {"file": "SandboxRuntime", "status": status, "iterations": detailed_error[:200]}
            }
            s.send(json.dumps(payload).encode('utf-8'))
            s.close()
        except Exception:
            pass

if __name__ == "__main__":
    sandbox = RuntimeSandboxExecutor()
    print("[Sandbox Engine] Isolated runtime monitor active.")
