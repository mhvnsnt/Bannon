import * as acorn from 'acorn';

self.onmessage = function(e) {
    const code = e.data;
    try {
        const ast = acorn.parse(code, { ecmaVersion: 2024, locations: true });
        
        const spatialNodes: any[] = [];
        let depthY = 0;

        const traverse = (node: any, parentId = null) => {
            if (!node) return;
            
            const nodeId = Math.random().toString(36).substr(2, 9);
            const nodeData: any = { id: nodeId, type: node.type, parent: parentId, depth: depthY };
            
            if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
                nodeData.meshType = 'enclosure';
                depthY -= 2.0; 
            } else if (node.type === 'ForStatement' || node.type === 'WhileStatement') {
                nodeData.meshType = 'loop';
                depthY -= 1.0;
            } else if (node.type === 'IfStatement') {
                nodeData.meshType = 'branch';
                depthY -= 0.5;
            } else if (node.type === 'VariableDeclaration') {
                nodeData.meshType = 'variable';
                depthY -= 0.2;
            } else {
                nodeData.meshType = 'node';
            }
            
            spatialNodes.push(nodeData);

            for (const key in node) {
                if (node[key] && typeof node[key] === 'object') {
                    if (Array.isArray(node[key])) {
                        node[key].forEach((child: any) => traverse(child, nodeId));
                    } else {
                        traverse(node[key], nodeId);
                    }
                }
            }
        };

        traverse(ast);
        self.postMessage({ status: 'success', nodes: spatialNodes });
    } catch (err: any) {
        self.postMessage({ status: 'error', error: err.message });
    }
};
