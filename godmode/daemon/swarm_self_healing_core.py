# swarm_self_healing_core.py - Core Local Swarm Execution Script
import os
import sys
import json
import time
import socket
import subprocess
import requests

class SwarmSelfHealingCore:
    def __init__(self, target_node_ipc_port=6005, inference_engine_url="http://127.0.0"):
        self.node_ipc_port = target_node_ipc_port
        self.inference_url = inference_engine_url
        self.workspace_root_path = os.path.abspath("./public/library")

    def run_isolated_compilation_check(self):
        """Runs your local compilation pipeline natively inside your project workspace folder."""
        print("[Compiler] Running local compilation validation loop...")
        try:
            # Change this execution array to point directly to your compiler (e.g., ["cargo", "check"])
            build_execution_result = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                cwd=os.path.dirname(self.workspace_root_path),
                capture_output=True,
                text=True,
                timeout=10
            )
            if build_execution_result.returncode == 0:
                return {"status": "SUCCESS", "diagnostic_payload": None}
            else:
                return {"status": "COMPILE_FAIL", "diagnostic_payload": build_execution_result.stderr}
        except Exception as generic_exception:
            return {"status": "RUNTIME_EXECUTION_CRASH", "diagnostic_payload": str(generic_exception)}

    def dispatch_swarm_correction_request(self, file_path, current_broken_code, isolated_compiler_logs):
        """Pipes broken files and compiler outputs right back to your local model swarm for parsing fixes."""
        print("[Swarm Network] Compilation block caught. Dispensing raw errors to local models...")
        
        system_directive = (
            "You are an offline structural self-correcting engine framework.\n"
            "The code string provided failed compilation checks. Review the diagnostic track.\n"
            "Output the updated code string clean. No conversational text. No markdown format boxes."
        )
        
        user_context_block = (
            f"Target Context Path: {file_path}\n\n"
            f"Current Code Frame:\n{current_broken_code}\n\n"
            f"Raw Compiler Output:\n{isolated_compiler_logs}\n\n"
            f"Task: Fix syntax mistakes or types so compilation passes completely."
        )

        payload_configuration = {
            "model": "local-swarm-coder",
            "messages": [
                {"role": "system", "content": system_directive},
                {"role": "user", "content": user_context_block}
            ],
            "temperature": 0.0 # Force low temperature settings to prevent hallucinations
        }

        try:
            network_response = requests.post(self.inference_url, json=payload_configuration, timeout=45)
            extracted_remediation_tokens = network_response.json()['choices']['message']['content']
            return extracted_remediation_tokens.strip()
        except Exception as network_exception:
            print(f"[Error Engine] Unable to fetch response from swarm: {network_exception}")
            return None

    def execute_healing_sequence(self, structural_file_name, target_initial_code, max_repair_cycles=3):
        """Runs an in-memory optimization loop, updating code step-by-step until the compiler reports success."""
        file_absolute_path = path_layer = os.path.join(self.workspace_root_path, structural_file_name)
        active_working_code_state = target_initial_code

        for ongoing_cycle in range(1, max_repair_cycles + 1):
            print(f"[Cycle {ongoing_cycle}/{max_repair_cycles}] Committing code segment to workspace folder...")
            
            # Safe transactional file write inside the chokidar-watched workspace folder
            with open(file_absolute_path, "w", encoding="utf-8") as file_stream:
                file_stream.write(active_working_code_state)
            
            # Brief processing delay to allow the file tracking layers to sync up
            time.sleep(0.15)

            # Audit the current code structure against your local compiler tool
            evaluation_metrics = self.run_isolated_compilation_check()
            if evaluation_metrics["status"] == "SUCCESS":
                print(f"[Success] Structural loop closed. Code compiled cleanly on cycle {ongoing_cycle}.")
                self.pipe_telemetry_to_node_runtime(structural_file_name, "SUCCESS", ongoing_cycle)
                return True
            
            print(f"[Diagnostic Action] Compilation failed on trace run {ongoing_cycle}. Analyzing errors...")
            active_working_code_state = self.dispatch_swarm_correction_request(
                structural_file_name, 
                active_working_code_state, 
                evaluation_metrics["diagnostic_payload"]
            )
            if not active_working_code_state:
                break

        print("[Self-Correction Check Failed] Maximum remediation iterations hit. Halting operations.")
        self.pipe_telemetry_to_node_runtime(structural_file_name, "FAILED_AND_ABORTED", max_repair_cycles)
        return False

    def pipe_telemetry_to_node_runtime(self, associated_file, processing_status, total_cycles_run):
        """Pushes current self-healing log metrics straight out to your active Node.js server."""
        try:
            client_communication_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_communication_socket.connect(("127.0.0.1", self.node_ipc_port))
            json_rpc_payload = {
                "jsonrpc": "2.0",
                "method": "ast/telemetry",
                "params": {"file": associated_file, "status": processing_status, "iterations": total_cycles_run}
            }
            client_communication_socket.send(json.dumps(json_rpc_payload).encode('utf-8'))
            client_communication_socket.close()
        except Exception as telemetry_error:
            print(f"[Telemetry Pipe Fail]: {telemetry_error}")

if __name__ == "__main__":
    healer_core_instance = SwarmSelfHealingCore()
    # Simulating a buggy input from your chat interface to test the compiler driver hook
    faulty_mock_input = "const testStringData: number = 'Force a compilation type failure';"
    healer_core_instance.execute_healing_sequence("engine.ts", faulty_mock_input)
