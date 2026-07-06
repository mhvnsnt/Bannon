import json
import requests
import socket
from swarm_orchestrator import dispatch_swarm_request, inject_to_god_mode_daemon

GOD_MODE_IPC_PORT = 6000

def trigger_self_healing_loop(target_file, compiler_error, previous_mutation):
    """
    Takes the failed mutation and raw stderr compiler output, formats it mathematically 
    into a context block, and redirects it into the local model swarm for a rigid fix.
    """
    print(f"\n[Self-Healing Loop] Initiating automated remediation for: {target_file}")
    print(f"[Compiler Error Log Trapped]:\n{compiler_error}\n")

    # Load the target file context for the swarm to read
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            file_context = f.read()
    except Exception as e:
        file_context = f"// File missing or inaccessible: {str(e)}"

    system_recovery_prompt = (
        f"The previous structural AST mutation resulted in a SYNTAX/COMPILATION ERROR.\n"
        f"Previous Mutation Attempt:\n{json.dumps(previous_mutation, indent=2)}\n\n"
        f"Compiler Stderr Trapped:\n{compiler_error}\n\n"
        f"Identify the syntax discrepancy, missing dependency, or typing fault. "
        f"Generate a corrected AST mutation."
    )

    # Re-dispatch to the local swarm with the error context
    print("[Self-Healing Loop] Dispatching context to local swarm...")
    corrected_mutation = dispatch_swarm_request(system_recovery_prompt, file_context)

    print("[Self-Healing Loop] Corrected Mutation Received. Injecting back into God Mode OS Daemon...")
    result = inject_to_god_mode_daemon(corrected_mutation)
    
    print(f"[Self-Healing Loop] System Verification Response: {result}")
    return result

if __name__ == "__main__":
    # Test harness
    dummy_file = "/mnt/memfs/project/src/main.rs"
    dummy_error = "error: expected `;`, found `}` on line 12"
    dummy_prev_mutation = {
        "mutation_type": "ADD_FUNCTION",
        "new_value": "fn test() { let x = 5 }"
    }
    
    trigger_self_healing_loop(dummy_file, dummy_error, dummy_prev_mutation)
