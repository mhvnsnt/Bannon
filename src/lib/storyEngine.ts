import { StoryNode } from '../types';

export const StoryEngine = {
  createStoryNode: (id: string, dialogue: string, nextNodes: string[]) => {
    return { id, dialogue, nextNodes };
  },
  
  findNode: (nodes: StoryNode[], id: string) => {
    return nodes.find(node => node.id === id);
  },

  getFederationLore: (federationId: string) => {
    const lores: Record<string, any> = {
      'bannon_main': {
        name: 'Bannon Championship',
        roster: ['Bannon', 'Vortex', 'The Fiend', 'Apex'],
        ppvSchedule: ['Genesis', 'Bloodbath', 'Apex Predator', 'God Within'],
        matchFlowStyle: 'native'
      },
      'mma_pride': {
        name: 'Pride Fighting',
        roster: ['The Striker', 'Grapple King', 'Bannon', 'Iron Fist'],
        ppvSchedule: ['Pride 1', 'Pride 2', 'Final Conflict'],
        matchFlowStyle: 'pride_mma'
      }
    };
    return lores[federationId];
  },

  generateStartingMemory: (characterId: string, federationId: string) => {
    return {
      superstarId: characterId,
      rivalries: [],
      alliances: [],
      storylineFlags: { 'debut': true, 'federation_joined': federationId },
      morale: 100,
      fatigue: 0
    };
  },

  parseBookLore: (loreText: string, characterId: string) => {
    // 1. Write parser logic that reads Book Lore files from /src/lib/storyEngine.ts and maps them into Career Mode Rivalry Contexts.
    const rivalries = [];
    const alliances = [];
    
    // Simple mock parsing logic
    if (loreText.includes("hates")) {
      const parts = loreText.split("hates");
      if (parts.length > 1) {
        rivalries.push({ targetId: parts[1].trim(), context: "Book Lore: Deep hatred", intensity: 80 });
      }
    }
    if (loreText.includes("allied with")) {
      const parts = loreText.split("allied with");
      if (parts.length > 1) {
        alliances.push({ targetId: parts[1].trim(), context: "Book Lore: Alliance", strength: 75 });
      }
    }
    
    return { rivalries, alliances };
  }
};
