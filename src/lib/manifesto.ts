import initialRegistry from '../../manifesto-registry.json';

export interface RegistryItem {
  id: string;
  name: string;
  type: string;
  owner: string;
  file?: string;
  cpp_header?: string;
  description: string;
  keywords: string[];
}

class ManifestoRegistry {
  private registry: Map<string, RegistryItem> = new Map();

  constructor() {
    // Populate with baseline registry from manifesto-registry.json
    initialRegistry.systems.forEach((system: any) => {
      this.register(system);
    });
  }

  /**
   * Register a new subsystem into the Bannon engine canonical registry
   */
  public register(item: RegistryItem): void {
    if (!item.id) {
      console.error('[Manifesto] Cannot register item without a unique id:', item);
      return;
    }
    this.registry.set(item.id.toLowerCase(), {
      ...item,
      keywords: (item.keywords || []).map(k => k.toLowerCase())
    });
    console.log(`[Manifesto] Registered system: ${item.name} (${item.id})`);
  }

  /**
   * Query the registry by a keyword, name, or description
   */
  public query(term: string): RegistryItem[] {
    const cleanTerm = term.toLowerCase().trim();
    if (!cleanTerm) return this.list();

    return this.list().filter(item => {
      const nameMatch = item.name.toLowerCase().includes(cleanTerm);
      const idMatch = item.id.toLowerCase().includes(cleanTerm);
      const descMatch = item.description.toLowerCase().includes(cleanTerm);
      const typeMatch = item.type.toLowerCase().includes(cleanTerm);
      const kwMatch = item.keywords.some(k => k.includes(cleanTerm));
      return nameMatch || idMatch || descMatch || typeMatch || kwMatch;
    });
  }

  /**
   * List all registered subsystems
   */
  public list(): RegistryItem[] {
    return Array.from(this.registry.values());
  }
}

// Inject into global window object for browser & agent query access
if (typeof window !== 'undefined') {
  (window as any).MANIFESTO = new ManifestoRegistry();
}

export const manifesto = typeof window !== 'undefined' 
  ? (window as any).MANIFESTO as ManifestoRegistry 
  : new ManifestoRegistry();
