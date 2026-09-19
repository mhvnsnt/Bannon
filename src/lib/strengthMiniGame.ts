import { StrengthMiniGame } from '../types';

export const StrengthMiniGameManager = {
  createGame: (difficulty: number, threshold: number): StrengthMiniGame => {
    return { difficulty, threshold };
  },

  checkSuccess: (currentInput: number, game: StrengthMiniGame) => {
    return currentInput >= game.threshold;
  }
};
