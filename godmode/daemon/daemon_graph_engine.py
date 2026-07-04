import os
import networkx as nx
import tree_sitter_languages
from tree_sitter import Parser

class ZeroContextEngine:
    def __init__(self, workspace_dir):
        self.workspace_dir = workspace_dir
        self.graph = nx.DiGraph()
        # Initialize tree-sitter parser for structural mapping
        try:
            self.language = tree_sitter_languages.get_language('rust')
            self.parser = Parser()
            self.parser.set_language(self.language)
        except Exception:
            # Fallback configuration placeholder
            self.parser = None

    def index_workspace(self):
        """Walks the MemFS workspace and maps code constructs to the Graph DB."""
        for root, _, files in os.walk(self.workspace_dir):
            for file in files:
                if file.endswith(('.rs', '.cpp', '.ts', '.go')):
                    file_path = os.path.join(root, file)
                    self._parse_file(file_path)

    def _parse_file(self, file_path):
        if not self.parser:
            return
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        tree = self.parser.parse(bytes(content, "utf8"))
        root_node = tree.root_node

        # Simple query to extract item names (functions, structs)
        rel_path = os.path.relpath(file_path, self.workspace_dir)
        self.graph.add_node(rel_path, type='file', content=content)

        # Traverse AST and extract structural block boundaries
        def traverse(node):
            if node.type in ['function_item', 'struct_item', 'impl_item']:
                # Find name identifier child
                name = None
                for child in node.children:
                    if child.type == 'identifier':
                        name = content[child.start_byte:child.end_byte]
                if name:
                    node_id = f"{rel_path}::{name}"
                    self.graph.add_node(node_id,
                                        type=node.type,
                                        start=node.start_byte,
                                        end=node.end_byte,
                                        code=content[node.start_byte:node.end_byte])
                    self.graph.add_edge(rel_path, node_id, relationship='contains')
            for child in node.children:
                traverse(child)

        traverse(root_node)

    def query_context(self, target_symbol):
        """Retrieves exact structural context and immediate dependencies."""
        context_blocks = []
        for node, data in self.graph.nodes(data=True):
            if target_symbol in node:
                context_blocks.append(data.get('code', ''))
                # Pull immediate structural neighbors to prevent compile errors
                for neighbor in self.graph.neighbors(node):
                    neighbor_data = self.graph.nodes[neighbor]
                    if 'code' in neighbor_data:
                        context_blocks.append(neighbor_data['code'])
        return "\n".join(list(set(context_blocks)))

if __name__ == "__main__":
    # Point directly to your in-memory RAM disk workspace path
    engine = ZeroContextEngine(workspace_dir="/mnt/memfs/project")
    print("[Daemon Engine] Structural Code Graph initialized.")