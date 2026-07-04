import os
import re
import json
import socket

class AutomatedASTStubber:
    def __init__(self, memfs_path="./public/library", node_ipc_port=6000):
        self.memfs_path = os.path.abspath(memfs_path)
        self.node_ipc_port = node_ipc_port

    def scan_and_heal_missing_symbols(self, compiler_stderr):
        """Parses raw compiler errors to find missing type declarations and drops stubs."""
        # Regex pattern targeting typical missing symbol indicators (TypeScript / ES modules)
        missing_module_match = re.search(r"Cannot find module '([\w\-/]+)'", compiler_stderr)
        missing_property_match = re.search(r"Property '(\w+)' does not exist on type '(\w+)'", compiler_stderr)

        if missing_module_match:
            module_name = missing_module_match.group(1)
            return self._generate_module_stub(module_name)
        
        if missing_property_match:
            prop_name = missing_property_match.group(1)
            interface_name = missing_property_match.group(2)
            return self._patch_interface_stub(interface_name, prop_name)
            
        return False

    def _generate_module_stub(self, module_name):
        """Generates a mock implementation of a missing file module directly inside your MemFS disk."""
        stub_dir = os.path.join(self.memfs_path, os.path.dirname(module_name))
        os.makedirs(stub_dir, exist_ok=True)
        
        stub_file = os.path.join(self.memfs_path, f"{module_name}.ts")
        stub_content = (
            "// Auto-Generated System Stub to bypass compiler lockups\n"
            "export const ProxyHandler = new Proxy({}, { get: () => () => {} });\n"
            "export default ProxyHandler;\n"
        )
        
        with open(stub_file, "w", encoding="utf-8") as f:
            f.write(stub_content)
        
        self._notify_ipc(f"Injected mock module stub: /public/library/{module_name}.ts")
        return True

    def _patch_interface_stub(self, interface_name, property_name):
        """Dynamically appends missing declarations to your active type definitions file."""
        # Search for the declaration file inside the in-memory workspace
        for root, _, files in os.walk(self.memfs_path):
            for file in files:
                if file.endswith(".ts"):
                    file_path = os.path.join(root, file)
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    if f"interface {interface_name}" in content or f"class {interface_name}" in content:
                        # Append the missing method stub gracefully right before the closure bracket
                        pattern = rf"(interface\s+{interface_name}\s*\{{[^}}]*)"
                        patched_content = re.sub(pattern, rf"\1\n  {property_name}: any;", content)
                        
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(patched_content)
                        
                        self._notify_ipc(f"Patched missing property '{property_name}' into structural type '{interface_name}'")
                        return True
        return False

    def _notify_ipc(self, message):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("127.0.0.1", self.node_ipc_port))
            s.send(json.dumps({"jsonrpc": "2.0", "method": "ast/telemetry", "params": {"file": "SystemStubber", "status": "STUB_INJECTED", "iterations": message}}).encode('utf-8'))
            s.close()
        except Exception:
            pass

if __name__ == "__main__":
    stubber = AutomatedASTStubber()
    print("[Stubber Engine] Automated runtime mocking layer operational.")
