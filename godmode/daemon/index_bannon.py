# index_bannon.py - Structural Dependency Map for Bannon
import os
import re
import json

class BannonPhysicsIndexer:
    def __init__(self, directory="./public/library"):
        self.directory = os.path.abspath(directory)
        self.symbol_table = {}

    def index_game_modules(self):
        """Indexes physics solvers, collision matrices, and animation handlers."""
        print("[Bannon Indexer] Mapping core physics engines...")
        for root, _, files in os.walk(self.directory):
            for file in files:
                if file.endswith(('.ts', '.cpp', '.rs')): # Adapt to Bannon's codebase language
                    path = os.path.join(root, file)
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Track structural signatures: classes, physics loops, custom constraint solvers
                    classes = re.findall(r'class\s+(\w+)', content)
                    methods = re.findall(r'(?:public|private|fn|function)\s+(\w+)\s*\(', content)
                    
                    rel_path = os.path.relpath(path, self.directory)
                    self.symbol_table[rel_path] = {
                        "classes": classes,
                        "methods": methods,
                        "file_size_lines": len(content.splitlines())
                    }
        print(f"[Success] System mapped {len(self.symbol_table)} modules for Bannon.")
        print(json.dumps(self.symbol_table, indent=2))

if __name__ == "__main__":
    indexer = BannonPhysicsIndexer()
    indexer.index_game_modules()
