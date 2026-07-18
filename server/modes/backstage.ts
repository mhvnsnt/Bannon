export interface BackstageState {
    superstarId: string;
    currentLocation: string;
    nearbyCharacters: string[];
    availableInteractions: ('talk' | 'brawl' | 'ignore' | 'form_alliance')[];
}

export const initBackstageRoam = (superstarId: string, location: string = 'Locker Room', roster: string[]): BackstageState => {
    // Randomly populate nearby characters from roster (excluding self)
    const others = roster.filter(id => id !== superstarId);
    const nearby = others.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    return {
        superstarId,
        currentLocation: location,
        nearbyCharacters: nearby,
        availableInteractions: ['talk', 'brawl', 'ignore', 'form_alliance']
    };
};

export const handleBackstageInteraction = (
    state: BackstageState, 
    targetId: string, 
    interaction: 'talk' | 'brawl' | 'ignore' | 'form_alliance'
) => {
    let resultMessage = '';
    let relationshipChange = 0;
    
    switch(interaction) {
        case 'talk':
            resultMessage = `You had a tense conversation with ${targetId}.`;
            relationshipChange = 5;
            break;
        case 'brawl':
            resultMessage = `You started a backstage brawl with ${targetId}! Security had to break it up.`;
            relationshipChange = -20;
            break;
        case 'ignore':
            resultMessage = `You walked past ${targetId} without saying a word.`;
            relationshipChange = -1;
            break;
        case 'form_alliance':
            resultMessage = `You proposed an alliance with ${targetId}. They accepted.`;
            relationshipChange = 50;
            break;
    }
    
    return {
        resultMessage,
        relationshipChange,
        newState: {
            ...state,
            availableInteractions: [] // End of interaction for this tick
        }
    };
};
