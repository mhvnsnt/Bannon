import { BlitzTextIngestionService } from './bbLexerPipeline.ts';
import { TranslationRouter } from './astDomainRouter.ts';
import { ASTGroupingEngine } from './astGroupingEngine.ts';
import { CodeGenLogger } from '../lib/firestore.ts';

export class TranslationService {
    private lexer: BlitzTextIngestionService;
    private router: TranslationRouter;

    constructor() {
        this.lexer = new BlitzTextIngestionService();
        this.router = new TranslationRouter();
    }

    public determineDomain(filename: string): 'Meta' | 'Physics' {
        const physicsFiles = ['AI.bb', 'Gameplay.bb', 'Attacks.bb', 'Moves.bb', 'Anims.bb', 'Particles.bb', 'Ground.bb', 'Functions.bb'];
        const metaFiles = ['Career.bb', 'Negotiations.bb', 'News.bb', 'Promos.bb', 'Texts.bb', 'Data.bb', 'Menus.bb', 'World.bb', 'Tournaments.bb', 'Teams.bb', 'Rivalries.bb', 'Court.bb'];
        
        if (physicsFiles.includes(filename)) return 'Physics';
        if (metaFiles.includes(filename)) return 'Meta';
        return 'Meta'; // Fallback
    }
    
    // Inject custom heuristics for Surrounding Game layers and Career mechanics
    public applySurroundingGameHeuristics(astObj: any, filename: string): any {
        if (!astObj || !astObj.ast) return astObj;
        
        const fileHeuristics = ['Tournaments.bb', 'Teams.bb', 'Career.bb', 'Negotiations.bb', 'Rivalries.bb'];
        
        if (fileHeuristics.includes(filename)) {
            // Find global multidimensional arrays representing brackets, rankings, or contract decay matrices
            // and attach meta-tags so astDomainRouter converts them to JSON/NoSQL schemas
            astObj.ast.forEach((node: any) => {
                if (node.type === 'Global') {
                    if (node.identifier.includes('Tournament') || node.identifier.includes('Rank') || 
                        node.identifier.includes('contractWeeks') || node.identifier.includes('starPower')) {
                        node.metaType = 'RelationalDatabaseSchema';
                    }
                }
                if (node.type === 'Function') {
                    if (node.identifier.includes('Book') || node.identifier.includes('Turn') ||
                        node.identifier.includes('decayContract') || node.identifier.includes('Negotiate')) {
                        node.metaType = 'NodeJS_Service_Route';
                    }
                }
            });
        }
        return astObj;
    }

    public async digestModule(filename: string, rawText: string): Promise<{ success: boolean; output?: string; error?: string }> {
        try {
            await CodeGenLogger.updateModuleStatus(filename, 'PENDING', { phase: 'digestion' });
            
            const parseResult = this.lexer.parse(rawText);
            if (!parseResult.success) {
                await CodeGenLogger.updateModuleStatus(filename, 'FAILURE', { errorMessage: `Parse Failed: ${parseResult.error}` });
                return { success: false, error: parseResult.error };
            }

            const domain = this.determineDomain(filename);
            const enrichedAST = this.applySurroundingGameHeuristics(parseResult.ast, filename);
            const translatedSource = this.router.routeAndTranslate(enrichedAST, domain);
            
            await CodeGenLogger.updateModuleStatus(filename, 'SUCCESS', { phase: 'digestion' });
            return { success: true, output: translatedSource };
            
        } catch (error) {
            const errStr = error instanceof Error ? error.message : String(error);
            await CodeGenLogger.updateModuleStatus(filename, 'FAILURE', { errorMessage: `Translation Failed: ${errStr}` });
            return { success: false, error: errStr };
        }
    }
}
