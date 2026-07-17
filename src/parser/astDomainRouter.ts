import { ASTNode } from './bbLexerPipeline.js';

export class TranslationRouter {
    public mapMetaAttributes(astNode: any): string {
        // Directs Career, Negotiations, News, and Promos to Node.js TypeScript templates
        // Checks the heuristic tags applied by TranslationService
        if (astNode.metaType === 'RelationalDatabaseSchema') {
            return `export interface I${astNode.identifier}Schema { /* JSON AST Mapping from ${astNode.identifier} */ }`;
        }
        if (astNode.type === 'Type' || astNode.type === 'Global') {
            return `export interface ${astNode.identifier} { /* Generated TS Mapping */ }`;
        }
        return '';
    }

    public mapPhysicsTelemetry(astNode: any): string {
        // Directs Attacks, Moves, Particles, and Anims to C++ Structs/Headers
        if (astNode.type === 'Type') {
            return `struct ${astNode.identifier} { /* Generated C++ Struct Mapping */ };`;
        }
        return '';
    }

    public resolveGlobalStateMutations(astNode: any): string {
        // Normalizes global state changes into pure-function deterministic hooks
        if (astNode.metaType === 'NodeJS_Service_Route') {
            return `export const ${astNode.identifier}Service = async (payload: any) => { /* Generated Backend Route */ return payload; }`;
        }
        if (astNode.type === 'Function') {
            return `export const ${astNode.identifier} = (state: any) => { return state; }`;
        }
        return '';
    }
    
    public routeAndTranslate(ast: any, sourceCategory: 'Meta' | 'Physics'): string {
        let output = '';
        for (const node of ast.ast as ASTNode[]) {
            if (sourceCategory === 'Meta') {
                const metaAttr = this.mapMetaAttributes(node);
                if (metaAttr) output += metaAttr + '\n';
                
                const mutation = this.resolveGlobalStateMutations(node);
                if (mutation) output += mutation + '\n';
            } else if (sourceCategory === 'Physics') {
                const physAttr = this.mapPhysicsTelemetry(node);
                if (physAttr) output += physAttr + '\n';
            }
        }
        return output;
    }
}
