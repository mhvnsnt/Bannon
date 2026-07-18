// Career Mode Logic
import { CareerModeState } from '../../src/types';
import { StoryEngine } from '../../src/lib/storyEngine';

export const initCareerMode = (superstarId: string = 'player_1', federationId: string = 'indies_base', loreBackground: string = 'Unknown'): CareerModeState => {
    const memory = StoryEngine.generateStartingMemory(superstarId, federationId);
    let rivalries = memory.rivalries;
    let alliances = memory.alliances;

    if (loreBackground !== 'Unknown') {
        const parsed = StoryEngine.parseBookLore(loreBackground, superstarId);
        rivalries = parsed.rivalries;
        alliances = parsed.alliances;
    }

    return {
        rank: 100, // Starting at the bottom of the power rankings
        history: [{ event: 'Initial Tryout / Debut', result: 'Win', impact: 10 }],
        currentFederationId: federationId,
        loreBackground: loreBackground,
        characterMemory: {
            ...memory,
            rivalries,
            alliances
        }
    };
};

export const updateCareerRank = (state: CareerModeState, win: boolean, matchQuality: number = 5): CareerModeState => {
    // Rank drops (improves) with wins, climbs (worsens) with losses
    // Better match quality accelerates movement
    const rankChange = win ? Math.floor(matchQuality * 1.5) : -Math.floor(matchQuality * 0.5);
    const newRank = Math.max(1, state.rank - rankChange);
    
    // Determine milestone based on rank thresholds (WWE 2k logic)
    let milestone = null;
    if (state.rank > 50 && newRank <= 50) milestone = "Drafted to Main Roster";
    if (state.rank > 10 && newRank <= 10) milestone = "Entered Championship Contention";
    if (state.rank > 1 && newRank === 1) milestone = "Achieved #1 Contender Status";

    const newHistoryEvent = {
        event: milestone ? `Milestone: ${milestone}` : `Match (Quality: ${matchQuality})`,
        result: win ? 'Win' : 'Loss',
        impact: rankChange
    };

    return { 
        ...state, 
        rank: newRank,
        history: [...state.history, newHistoryEvent]
    };
};
