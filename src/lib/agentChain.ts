import { BlitzTextIngestionService } from '../parser/bbLexerPipeline.ts';
import { CodeGenLogger } from './firestore.ts';

export interface ChainConfig {
    maxOutputTokens: number;
    anchorLines: number;
}

export class AutonomousChainingAgent {
    private config: ChainConfig;
    
    constructor(config: Partial<ChainConfig> = {}) {
        this.config = {
            maxOutputTokens: 65536,
            anchorLines: 20,
            ...config
        };
    }

    public evaluateTruncation(output: string, terminationReason: 'MAX_TOKENS' | 'STOP' | 'COMPLETED'): {
        isTruncated: boolean;
        anchorCode?: string;
        injectionPrompt?: string;
    } {
        if (terminationReason === 'MAX_TOKENS' || this.detectTruncationSignatures(output)) {
            const lines = output.split('\n');
            const trailing = lines.slice(-this.config.anchorLines).join('\n');
            
            return {
                isTruncated: true,
                anchorCode: trailing,
                injectionPrompt: `Resume the exact C++ generation stream from [Last Valid Code Anchor]. Maintain absolute structural integrity. Zero preamble. Resume syntax.\n\n[Last Valid Code Anchor]:\n${trailing}`
            };
        }
        
        return { isTruncated: false };
    }

    private detectTruncationSignatures(output: string): boolean {
        // Fallback checks if the system didn't flag MAX_TOKENS explicitly but it got cut off mid-block
        const openBraces = (output.match(/\{/g) || []).length;
        const closeBraces = (output.match(/\}/g) || []).length;
        
        if (openBraces > closeBraces) return true;
        
        return false;
    }

    public async executeExtractionLoop(moduleId: string, initialPrompt: string, generatorFn: (prompt: string) => Promise<{output: string, reason: string}>, outputWriter: (content: string) => Promise<void>) {
        await CodeGenLogger.updateModuleStatus(moduleId, 'PENDING');
        
        let currentPrompt = initialPrompt;
        let complete = false;
        let totalExtracted = 0;
        
        try {
            while (!complete) {
                const result = await generatorFn(currentPrompt);
                await outputWriter(result.output);
                
                totalExtracted += result.output.split('\n').length;
                
                const evaluation = this.evaluateTruncation(result.output, result.reason as any);
                
                if (evaluation.isTruncated && evaluation.injectionPrompt) {
                    await CodeGenLogger.logCycle({
                        moduleId,
                        targetFile: moduleId,
                        status: 'TRUNCATED',
                        extractedLines: totalExtracted
                    });
                    
                    currentPrompt = evaluation.injectionPrompt;
                } else {
                    complete = true;
                    await CodeGenLogger.logCycle({
                        moduleId,
                        targetFile: moduleId,
                        status: 'SUCCESS',
                        extractedLines: totalExtracted
                    });
                    await CodeGenLogger.updateModuleStatus(moduleId, 'SUCCESS', { extractedLines: totalExtracted });
                }
            }
        } catch (error) {
            const errString = error instanceof Error ? error.message : String(error);
            await CodeGenLogger.logCycle({
                moduleId,
                targetFile: moduleId,
                status: 'FAILURE',
                errorMessage: errString
            });
            await CodeGenLogger.updateModuleStatus(moduleId, 'FAILURE', { errorMessage: errString });
            throw error;
        }
    }
}
