import { ASTNode } from './bbLexerPipeline.js';

export class TranslationRouter {
    public mapMetaAttributes(astNode: ASTNode): string {
        // Directs Career, Negotiations, News, and Promos to Node.js TypeScript templates
        if (astNode.type === 'Type' || astNode.type === 'Global') {
            return `export interface ${astNode.identifier} { /* Generated TS Mapping */ }`;
        }
        return '';
    }

    public mapPhysicsTelemetry(astNode: ASTNode): string {
        // Directs Attacks, Moves, Particles, and Anims to C++ Structs/Headers
        if (astNode.type === 'Type') {
            return `struct ${astNode.identifier} { /* Generated C++ Struct Mapping */ };`;
        }
        return '';
    }

    public resolveGlobalStateMutations(astNode: ASTNode): string {
        // Normalizes global state changes into pure-function deterministic hooks
        if (astNode.type === 'Function') {
            return `export const ${astNode.identifier} = (state: any) => { return state; }`;
        }
        return '';
    }
    
    public routeAndTranslate(ast: any, sourceCategory: 'Meta' | 'Physics'): string {
        let output = '';
        for (const node of ast.ast as ASTNode[]) {
            if (sourceCategory === 'Meta') {
                output += this.mapMetaAttributes(node) + '\n';
                output += this.resolveGlobalStateMutations(node) + '\n';
            } else if (sourceCategory === 'Physics') {
                output += this.mapPhysicsTelemetry(node) + '\n';
            }
        }
        return output;
    }
}
