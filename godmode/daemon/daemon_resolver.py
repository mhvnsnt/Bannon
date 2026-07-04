import os
import re

class MultiFileResolver:
    def __init__(self, workspace_dir="/public/library"):
        self.workspace_dir = os.path.abspath("." + workspace_dir)

    def scan_for_broken_imports(self, modified_file, mutation_payload):
        """Scans the local filesystem to catch cascading compilation breaks."""
        broken_dependents = []
        base_name = os.path.basename(modified_file).split('.')[0]
        
        # Track which exported keys were touched
        mutated_keys = re.findall(r'(?:export\s+class\s+|export\s+const\s+|export\s+interface\s+)(\w+)', mutation_payload)
        
        if not mutated_keys:
            return broken_dependents

        # Crawl workspace directory to detect files importing the modified module
        for root, _, files in os.walk(self.workspace_dir):
            for file in files:
                if file.endswith(('.ts', '.tsx', '.js')) and not modified_file in file:
                    full_path = os.path.join(root, file)
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # If the file imports from our modified file, add it to the tracking matrix
                    if base_name in content:
                        for key in mutated_keys:
                            if key in content:
                                broken_dependents.append({
                                    "file": os.path.relpath(full_path, self.workspace_dir),
                                    "imported_symbol": key
                                })
        return broken_dependents

if __name__ == "__main__":
    resolver = MultiFileResolver()
    print("[Resolver Core] Cross-dependency scanning engine ready.")
