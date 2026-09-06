import { CharacterProfile } from './characters';

export type ArchetypeType = 'powerhouse' | 'brawler' | 'striker' | 'technician' | 'highFlyer' | 'freeAgent';

export const ArchetypeManager = {
  getArchetypeStats: (archetype: ArchetypeType) => {
    switch (archetype) {
      case 'powerhouse': return { strength: 10, speed: 2, toughness: 8 };
      case 'brawler': return { strength: 8, speed: 4, toughness: 6 };
      case 'striker': return { strength: 5, speed: 8, toughness: 4 };
      case 'technician': return { strength: 6, speed: 6, toughness: 5 };
      case 'highFlyer': return { strength: 3, speed: 10, toughness: 3 };
      case 'freeAgent': return { strength: 5, speed: 5, toughness: 5 };
      default: return { strength: 5, speed: 5, toughness: 5 };
    }
  },

  applyArchetype: (char: CharacterProfile): CharacterProfile => {
    if (!char.archetype) return char;
    const stats = ArchetypeManager.getArchetypeStats(char.archetype as ArchetypeType);
    return { ...char, stats, injuryPersistence: char.injuryPersistence || {} };
  }
};
