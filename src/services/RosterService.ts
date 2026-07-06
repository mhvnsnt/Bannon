import rosterData from '../../roster.json';

export interface Attire {
  id: string;
  name: string;
  color: string;
  accent: string;
}

export interface Character {
  id: string;
  name: string;
  dna: string;
  role: 'Wrestler' | 'Manager' | 'Specialist';
  poise: number; // 0-100
  hp: number; // Health
  speed: number; // Speed
  strength: number; // Power
  physicsScale: number; // Height or mass multiplier
  payback: string;
  manager: string;
  bio: string;
  attires: Attire[];
}

export class RosterService {
  private static instance: RosterService | null = null;
  private characters: Character[] = [];

  private constructor() {
    this.loadInitialRoster();
  }

  public static getInstance(): RosterService {
    if (!RosterService.instance) {
      RosterService.instance = new RosterService();
    }
    return RosterService.instance;
  }

  /**
   * Load the initial roster from the imported JSON file
   */
  private loadInitialRoster(): void {
    try {
      // Check if we have modified roster stored locally
      const stored = localStorage.getItem('bannon_custom_roster');
      if (stored) {
        this.characters = JSON.parse(stored);
      } else {
        this.characters = rosterData as Character[];
      }
    } catch (e) {
      console.warn('LocalStorage not available, defaulting to static roster data:', e);
      this.characters = rosterData as Character[];
    }
  }

  /**
   * Fetch the full active roster
   */
  public getRoster(): Character[] {
    return this.characters;
  }

  /**
   * Get a character by their unique ID
   */
  public getCharacterById(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  /**
   * Filters the roster based on canon, non-canon sandbox, and meta admin roles
   */
  public getFilteredRoster(category: 'canon' | 'sandbox' | 'meta' | 'all'): Character[] {
    switch (category) {
      case 'canon':
        return this.characters.filter(c => 
          ['bannon', 'cain_elias', 'atlas_vance', 'stick_up', 'finxsse', 'red_cloud', 'cassian_thorne', 'sombra_negra', 'maime', 'solaris_justice', 'queen_tyneshia', 'karma'].includes(c.id)
        );
      case 'sandbox':
        return this.characters.filter(c => 
          ['viper', 'kage', 'brutus', 'zephyr', 'mortus', 'titan', 'golem', 'ronin'].includes(c.id)
        );
      case 'meta':
        return this.characters.filter(c => 
          ['cierra', 'marquis', 'nexus_prime', 'mdickie_legend', 'training_dummy', 'vince_m', 'brisk_cj', 'blue_p6'].includes(c.id)
        );
      default:
        return this.characters;
    }
  }

  /**
   * Saves updates to a character and synchronizes to local and remote backend
   */
  public async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const idx = this.characters.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new Error(`Character with ID ${id} not found.`);
    }

    this.characters[idx] = {
      ...this.characters[idx],
      ...updates
    };

    this.persistLocal();
    await this.syncWithBackend();

    return this.characters[idx];
  }

  /**
   * Creates a new custom character
   */
  public async createCharacter(character: Character): Promise<Character> {
    if (this.characters.some(c => c.id === character.id)) {
      throw new Error(`Character with ID ${character.id} already exists.`);
    }

    this.characters.push(character);
    this.persistLocal();
    await this.syncWithBackend();

    return character;
  }

  /**
   * Resets the entire roster back to original factory defaults
   */
  public async resetToDefaults(): Promise<Character[]> {
    localStorage.removeItem('bannon_custom_roster');
    this.characters = JSON.parse(JSON.stringify(rosterData));
    await this.syncWithBackend();
    return this.characters;
  }

  /**
   * Private helper to sync to local storage
   */
  private persistLocal(): void {
    try {
      localStorage.setItem('bannon_custom_roster', JSON.stringify(this.characters));
    } catch (e) {
      console.warn('Failed to persist roster locally:', e);
    }
  }

  /**
   * Sync the current roster to the Express backend so filesystem files stay updated
   */
  private async syncWithBackend(): Promise<void> {
    try {
      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.characters)
      });
      if (!response.ok) {
        console.warn('Backend roster synchronization returned code:', response.status);
      }
    } catch (e) {
      console.warn('Could not sync roster to backend (likely offline or local-only mode):', e);
    }
  }
}
