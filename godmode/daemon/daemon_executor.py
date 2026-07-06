import json
import socket
import subprocess
import os

class SwarmExecutionDaemon:
    def __init__(self, host='127.0.0.1', port=6000, memfs_path='/mnt/memfs/project'):
        self.host = host
        self.port = port
        self.memfs_path = memfs_path

    def start_ipc_listener(self):
        """Bootstraps the local IPC socket server for God Mode OS communication."""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((self.host, self.port))
        server.listen(5)
        print(f"[Daemon Core] IPC Socket actively listening on {self.host}:{self.port}")

        while True:
            conn, _ = server.accept()
            data = conn.recv(65536).decode('utf-8')
            if not data:
                continue
            try:
                payload = json.loads(data)
                if payload.get("method") == "ast/mutate":
                    response = self.handle_ast_mutation(payload["params"])
                    conn.sendall(json.dumps(response).encode('utf-8'))
            except Exception as e:
                conn.sendall(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
            finally:
                conn.close()

    def handle_ast_mutation(self, params):
        """Applies mutation to MemFS and runs the local headless compiler driver."""
        target_file = os.path.join(self.memfs_path, params["target_file"].lstrip("/"))

        # Ensure structural directories exist inside RAM drive
        os.makedirs(os.path.dirname(target_file), exist_ok=True)

        # In a complete build, this reads the Tree-sitter index and mutates the precise node.
        # For this execution bridge, it performs safe fallback transactional writes to Ramdisk.
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(params["new_value"])

        # Trigger headless isolated compilation check loop
        return self.run_compilation_loop(target_file)

    def run_compilation_loop(self, file_path):
        """Runs native localized build checks, trapping stderr for self-healing loops."""
        print(f"[Daemon Compiler] Intercepting file events for: {file_path}")

        # Tailor this execution hook to your project's local compiler (e.g., cargo check, tsc)
        try:
            result = subprocess.run(
                ["cargo", "check"],
                cwd=self.memfs_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                return {"status": "success", "message": "Compilation structural checks passed."}
            else:
                # Local self-healing hook: trap raw error context and loop back to model swarm
                return {
                    "status": "compile_error",
                    "message": "Compilation failed inside MemFS sandbox.",
                    "compiler_output": result.stderr
                }
        except Exception as e:
            return {"status": "execution_failed", "error": str(e)}

if __name__ == "__main__":
    daemon = SwarmExecutionDaemon()
    daemon.start_ipc_listener()