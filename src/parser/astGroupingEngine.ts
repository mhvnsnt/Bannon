import { ASTNode } from './bbLexerPipeline.ts';

export class ASTGroupingEngine {
    public buildNestedTree(flatTokens: ASTNode[]): ASTNode[] {
        const rootNodes: ASTNode[] = [];
        let currentParent: ASTNode | null = null;
        let currentContext: 'Type' | 'Function' | null = null;

        for (const token of flatTokens) {
            const rawLineLower = token.rawLines[0].toLowerCase();
            
            if (rawLineLower === 'end type' || rawLineLower === 'end function') {
                currentParent = null;
                currentContext = null;
                continue;
            }

            if (token.type === 'Type') {
                currentParent = { ...token, body: [] };
                rootNodes.push(currentParent);
                currentContext = 'Type';
            } else if (token.type === 'Function') {
                currentParent = { ...token, body: [] };
                rootNodes.push(currentParent);
                currentContext = 'Function';
            } else if (token.type === 'Field' && currentParent && currentContext === 'Type') {
                currentParent.body!.push(token);
            } else if (token.type === 'Dim') {
                const mappedDimNode: ASTNode = {
                    ...token,
                    identifier: this.parseDimArray(token.rawLines[0])
                };
                if (currentParent && currentContext === 'Function') {
                    currentParent.body!.push(mappedDimNode);
                } else {
                    rootNodes.push(mappedDimNode);
                }
            } else {
                if (currentParent) {
                    currentParent.body!.push(token);
                } else {
                    rootNodes.push(token);
                }
            }
        }

        return rootNodes;
    }

    private parseDimArray(rawLine: string): string {
        const match = rawLine.match(/Dim\s+([a-zA-Z0-9_]+)\s*\(/i);
        if (match && match[1]) {
            return match[1];
        }
        const parts = rawLine.split(' ');
        return parts.length > 1 ? parts[1].split('(')[0] : 'unknown_array';
    }
}
