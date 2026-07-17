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
        const physicsFiles = ['AI.bb', 'Gameplay.bb', 'Attacks.bb', 'Moves.bb', 'Anims.bb', 'Particles.bb'];
        const metaFiles = ['Career.bb', 'Negotiations.bb', 'News.bb', 'Promos.bb', 'Texts.bb', 'Data.bb', 'Menus.bb', 'World.bb'];
        
        if (physicsFiles.includes(filename)) return 'Physics';
        if (metaFiles.includes(filename)) return 'Meta';
        return 'Meta'; // Fallback
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
            const translatedSource = this.router.routeAndTranslate(parseResult.ast, domain);
            
            await CodeGenLogger.updateModuleStatus(filename, 'SUCCESS', { phase: 'digestion' });
            return { success: true, output: translatedSource };
            
        } catch (error) {
            const errStr = error instanceof Error ? error.message : String(error);
            await CodeGenLogger.updateModuleStatus(filename, 'FAILURE', { errorMessage: `Translation Failed: ${errStr}` });
            return { success: false, error: errStr };
        }
    }
}
