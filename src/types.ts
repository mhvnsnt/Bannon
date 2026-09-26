export type SupernaturalTraits = {
    teleportationChance: number;
    resilienceMultiplier: number;
    superhumanSpeed: number;
    mysticalAuraLevel: number;
};

export type Superstar = {
    id: string;
    name: string;
    stats: Record<string, number>;
    dna: Record<string, number>;
    supernatural?: SupernaturalTraits;
};

export type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
};

// Bannon Engine Feature Types
export type MoveSegment = {
    id: string;
    animation: string;
    damage: number;
    duration: number;
};

export type Finisher = {
    id: string;
    name: string;
    segments: MoveSegment[];
};

export type StoryNode = {
    id: string;
    dialogue: string;
    nextNodes: string[];
};

export type Archetype = {
    id: string;
    name: string;
    statModifiers: Record<string, number>;
};

export type Injury = {
    bodyPart: string;
    severity: number;
    locomotionPenalty: number;
};

export type StrengthMiniGame = {
    difficulty: number;
    threshold: number;
};

export type Championship = {
    id: string;
    name: string;
    championId: string;
    division: string[]; // Array of superstar IDs in this division
    contenders: { superstarId: string; rank: number; powerPoints: number }[];
};

export type Show = {
    id: string;
    name: string;
    roster: string[];
    championships: string[];
};

export type UniverseModeState = {
    calendar: any[];
    shows: Show[];
    championships: Record<string, Championship>;
    powerRankings: { superstarId: string; rank: number; movement: number }[];
    settings: {
        fullShowExperience: boolean; // true = intros, promos, outros. false = matches only
        enableBackstageFreeRoam: boolean; // MDickie-style backstage
    }
};

export type BackstageInteraction = {
    location: string;
    participants: string[];
    interactionType: 'Dialogue' | 'Brawl' | 'Alliance_Formed' | 'Rivalry_Started';
    context: string;
};

export type ShowSegment = {
    id: string;
    type: 'Intro' | 'Match' | 'Promo' | 'Backstage_Roam' | 'Outro';
    participants: string[];
    description: string;
    status: 'Pending' | 'InProgress' | 'Completed';
};

export type CareerHistoryEvent = {
    event: string;
    result: string;
    impact: number;
};

export type Federation = {
    id: string;
    name: string;
    style: 'Indies' | 'MainRoster' | 'Pride_MMA' | 'BookLore';
    generalManager: string;
    owner: string;
    showFlowType: string;
    ruleset: MatchRuleset;
};

export type MatchRuleset = {
    ropeBreaks: boolean;
    countOuts: boolean | number; // false for no count outs, number for count length (10 or 20)
    stoppage: 'Pin_Submission' | 'Ref_Stoppage_Only' | 'Points_Decision' | 'Hybrid';
    rounds?: number; // For Pride/MMA/Boxing
    roundDuration?: number; // In seconds
};

export type AICharacterMemory = {
    superstarId: string;
    rivalries: { opponentId: string; intensity: number; originEvent: string }[];
    alliances: { partnerId: string; trust: number }[];
    storylineFlags: Record<string, string | number | boolean>;
    morale: number;
    fatigue: number; // For tracking between shows
};

export type CareerModeState = {
    rank: number;
    history: CareerHistoryEvent[];
    currentFederationId: string;
    loreBackground: string;
    managerId?: string;
    characterMemory: AICharacterMemory;
};

export type GodWithinModeState = {
    narrativeFlags: Record<string, boolean>;
    currentStoryNode: string;
    skillTree: {
        unlockedNodes: string[];
        availableNodes: string[];
    };
};

export type GMModeState = {
    funds: number;
    rating: number;
    popularity: number;
    morale: number;
};

export type BackyardModeState = {
    hardcoreRules: string[];
};

export type SandboxModeState = {
    zone: string;
};

export type BackstageState = {
    currentArea: string;
};
