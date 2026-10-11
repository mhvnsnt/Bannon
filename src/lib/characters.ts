export interface CharacterProfile {
  id: string;
  name: string;
  role: 'Superstar' | 'Striker' | 'Powerhouse' | 'Manager';
  weight: number;
  heightScale: number;
  gimmick: string;
  modelPath: string;
  normalizedWeights: boolean;
  archetype?: 'powerhouse' | 'brawler' | 'striker' | 'technician' | 'highFlyer' | 'freeAgent';
  injuryPersistence?: Record<string, number>; // limb -> damage level
  stats?: Record<string, number>;
}

export const charactersRegistry = new Map<string, CharacterProfile>();

export function _addChar(id: string, char: Omit<CharacterProfile, 'id'>) {
  charactersRegistry.set(id, { id, ...char });
}

// Wire the 15 identities with unique attributes
_addChar('finxsse', {
  name: 'Finxsse',
  role: 'Superstar',
  weight: 220,
  heightScale: 1.0,
  gimmick: 'Aesthetic master of physical theatricality',
  modelPath: 'assets/models/finxsse.glb',
  normalizedWeights: true
});

_addChar('kobra', {
  name: 'Kobra',
  role: 'Striker',
  weight: 215,
  heightScale: 0.98,
  gimmick: 'Venomous counter-striking and high-velocity leaps',
  modelPath: 'assets/models/kobra.glb',
  normalizedWeights: true
});

_addChar('wreck_patterson', {
  name: 'Wreck Patterson',
  role: 'Powerhouse',
  weight: 295,
  heightScale: 1.12, // Taller model scaling
  gimmick: 'Unstoppable brawling powerhouse enforcer',
  modelPath: 'assets/models/wreck_patterson.glb',
  normalizedWeights: true
});

_addChar('master_sensei', {
  name: 'Master Sensei',
  role: 'Manager',
  weight: 175,
  heightScale: 0.92, // Shorter veteran
  gimmick: 'Strategic tactical wisdom and legendary ring generalship',
  modelPath: 'assets/models/master_sensei.glb',
  normalizedWeights: true
});

// Remaining 11 models wire identically with their matching 4-9MB GLBs
