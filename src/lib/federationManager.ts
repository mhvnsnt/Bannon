import { StoryEngine } from './storyEngine';
import { AICharacterMemory } from '../types';

export interface ShowSchedule {
  eventName: string;
  type: 'weekly' | 'ppv';
  date: string;
}

export interface MatchSequence {
  id: string;
  matchType: string;
  competitors: string[];
  winner?: string;
  promo?: string;
}

export class FederationManager {
  private currentFederation: string;
  
  constructor(federationId: string = 'bannon_main') {
    this.currentFederation = federationId;
  }

  public getRoster(): string[] {
    const fed = StoryEngine.getFederationLore(this.currentFederation);
    return fed ? fed.roster : [];
  }

  public getSchedules(): ShowSchedule[] {
    const fed = StoryEngine.getFederationLore(this.currentFederation);
    if (!fed) return [];
    
    return fed.ppvSchedule.map((ppv, idx) => ({
      eventName: ppv,
      type: 'ppv',
      date: `Month ${idx + 1}`
    }));
  }

  public generateMatchCard(showId: string): MatchSequence[] {
    const roster = this.getRoster();
    if (roster.length < 2) return [];
    
    return [
      {
        id: `match_${showId}_main`,
        matchType: '1v1',
        competitors: [roster[0], roster[1] || 'Unknown']
      }
    ];
  }

  public getMatchFlowStyle(): string {
    const fed = StoryEngine.getFederationLore(this.currentFederation);
    return fed ? fed.matchFlowStyle : 'native';
  }
}
