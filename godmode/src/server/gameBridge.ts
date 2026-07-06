import fs from 'fs';
import path from 'path';
import { nexusBus } from './modelRouter';
import { QuantumFileEngine } from './quantumFileEngine';

export interface GameDNA {
  PHYSICS?: {
    GRAVITY?: number;
    RAGDOLL_STIFFNESS?: number;
    TIME_STEP?: number;
    CONTACT_BETA?: number;
  };
  COMBAT?: {
    STRIKE_IMPULSE?: number;
    POISE_MAX?: number;
    STAMINA_REGEN_RATE?: number;
    HITBOX_RADIUS?: number;
  };
  variables?: Record<string, number>;
}

export class GameBridge {
  private static bannonPath = path.join(process.cwd(), 'public', 'bannon.html');
  private static registered = false;

  static register() {
    if (this.registered) return;
    this.registered = true;

    console.log('[GameBridge] Registering Game Bridge interface with Absolute Autonomy protocol.');

    nexusBus.on('DNA_PROMOTED', (event: { dna: any; category?: string; version?: number }) => {
      console.log(`[GameBridge] DNA_PROMOTED caught. Mutating Bannon physics grid:`, event.dna);
      try {
        const configToInject: Record<string, number> = {};
        
        // Map hierarchical DNA constants if present
        if (event.dna.PHYSICS) {
          if (event.dna.PHYSICS.GRAVITY !== undefined) configToInject['GRAVITY'] = event.dna.PHYSICS.GRAVITY;
        }
        if (event.dna.COMBAT) {
          if (event.dna.COMBAT.STRIKE_IMPULSE !== undefined) configToInject['STRIKE'] = event.dna.COMBAT.STRIKE_IMPULSE;
        }

        // Map general variables if direct flat key-value pairs are provided
        const flatVars = event.dna.variables || event.dna;
        for (const [key, val] of Object.entries(flatVars)) {
          if (typeof val === 'number') {
            configToInject[key] = val;
          }
        }

        this.injectDNA(configToInject, `DNA Promotion: ${event.category || 'autonomous'}`);
      } catch (err: any) {
        console.error('[GameBridge] DNA promotion handling failed:', err.message);
      }
    });
  }

  static injectDNA(dnaVars: Record<string, number>, changeLabel = 'Manual DNA injection'): boolean {
    try {
      if (!fs.existsSync(this.bannonPath)) {
        console.warn(`[GameBridge] bannon.html not found at ${this.bannonPath}. Aborting mutation.`);
        return false;
      }

      let content = fs.readFileSync(this.bannonPath, 'utf8');

      // Check if we can find the BANNON_CONFIG block in the html
      const bannonConfigRegex = /window\.BANNON_CONFIG\s*=\s*\{([\s\S]*?)\};/;
      const match = content.match(bannonConfigRegex);

      if (!match) {
        console.warn('[GameBridge] window.BANNON_CONFIG block not found in bannon.html');
        return false;
      }

      // Parse the key-values inside the block
      const configBody = match[1];
      
      // We will reconstruct the config block cleanly to preserve formatting but slide in new values
      const currentConfig: Record<string, number> = {};
      
      // Parse current values
      const pairRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(-?[0-9.]+)/g;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(configBody)) !== null) {
        currentConfig[pairMatch[1]] = parseFloat(pairMatch[2]);
      }

      // Merge new variables
      const mergedConfig = { ...currentConfig, ...dnaVars };

      // Format clean block
      const entries = Object.entries(mergedConfig).map(([k, v]) => `      ${k}: ${v}`);
      
      // Break into lines for formatting
      let formattedConfig = '\n';
      for (let i = 0; i < entries.length; i += 3) {
        formattedConfig += entries.slice(i, i + 3).join(', ') + (i + 3 < entries.length ? ',\n' : '\n');
      }

      const replacementText = `window.BANNON_CONFIG = {${formattedConfig}    };`;
      const mutatedContent = content.replace(bannonConfigRegex, replacementText);

      // Write mutated content back to public/bannon.html
      fs.writeFileSync(this.bannonPath, mutatedContent, 'utf8');
      console.log(`[GameBridge] Surgically mutated bannon.html with ${Object.keys(dnaVars).length} updated variables.`);

      // Store in QuantumFileEngine for file version history and reversibility
      try {
        QuantumFileEngine.storeFile('bannon.html', mutatedContent, changeLabel);
      } catch (qErr: any) {
        console.warn('[GameBridge] Failed to version-track the mutation in QuantumFileEngine:', qErr.message);
      }

      nexusBus.emit('GAME_BRIDGE_MUTATION', {
        success: true,
        variables: mergedConfig,
        updated: dnaVars,
        changeLabel,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (err: any) {
      console.error('[GameBridge] Error injecting DNA:', err);
      return false;
    }
  }

  static getActiveConfig(): Record<string, number> {
    try {
      if (!fs.existsSync(this.bannonPath)) return {};
      const content = fs.readFileSync(this.bannonPath, 'utf8');
      const match = content.match(/window\.BANNON_CONFIG\s*=\s*\{([\s\S]*?)\};/);
      if (!match) return {};
      
      const configBody = match[1];
      const parsed: Record<string, number> = {};
      const pairRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(-?[0-9.]+)/g;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(configBody)) !== null) {
        parsed[pairMatch[1]] = parseFloat(pairMatch[2]);
      }
      return parsed;
    } catch {
      return {};
    }
  }
}
