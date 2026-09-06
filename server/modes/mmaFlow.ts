// Pride/MMA Match Flow State Machine
export interface MMAMatchState {
    currentRound: number;
    maxRounds: number;
    roundTimeLeft: number; // in seconds
    status: 'pre_fight' | 'fighting' | 'between_rounds' | 'ended';
    points: Record<string, number>;
    stoppageReason?: 'ko' | 'tko' | 'submission' | 'doctor_stoppage' | 'decision';
    winnerId?: string;
}

export const initMMAMatch = (fighter1Id: string, fighter2Id: string, maxRounds: number = 3): MMAMatchState => {
    return {
        currentRound: 1,
        maxRounds,
        roundTimeLeft: 300, // 5 minute rounds
        status: 'pre_fight',
        points: {
            [fighter1Id]: 0,
            [fighter2Id]: 0
        }
    };
};

export const advanceMMATime = (state: MMAMatchState, seconds: number): MMAMatchState => {
    if (state.status !== 'fighting') return state;
    
    const newTime = state.roundTimeLeft - seconds;
    if (newTime <= 0) {
        if (state.currentRound >= state.maxRounds) {
            return calculateDecision({ ...state, roundTimeLeft: 0, status: 'ended' });
        } else {
            return {
                ...state,
                status: 'between_rounds',
                roundTimeLeft: 0
            };
        }
    }
    
    return { ...state, roundTimeLeft: newTime };
};

export const startNextRound = (state: MMAMatchState): MMAMatchState => {
    if (state.status !== 'between_rounds' && state.status !== 'pre_fight') return state;
    return {
        ...state,
        status: 'fighting',
        currentRound: state.status === 'between_rounds' ? state.currentRound + 1 : 1,
        roundTimeLeft: 300
    };
};

export const triggerRefStoppage = (state: MMAMatchState, winnerId: string, reason: 'ko' | 'tko' | 'submission' | 'doctor_stoppage'): MMAMatchState => {
    return {
        ...state,
        status: 'ended',
        stoppageReason: reason,
        winnerId
    };
};

export const addPoints = (state: MMAMatchState, fighterId: string, points: number): MMAMatchState => {
    return {
        ...state,
        points: {
            ...state.points,
            [fighterId]: (state.points[fighterId] || 0) + points
        }
    };
};

const calculateDecision = (state: MMAMatchState): MMAMatchState => {
    const fighterIds = Object.keys(state.points);
    const p1 = state.points[fighterIds[0]];
    const p2 = state.points[fighterIds[1]];
    
    let winnerId = undefined;
    if (p1 > p2) winnerId = fighterIds[0];
    else if (p2 > p1) winnerId = fighterIds[1];
    
    return {
        ...state,
        status: 'ended',
        stoppageReason: 'decision',
        winnerId
    };
};
