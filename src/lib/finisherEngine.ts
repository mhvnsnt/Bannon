import { MoveSegment } from '../types';

export const FinisherEngine = {
  createFinisher: (id: string, name: string, segments: MoveSegment[]) => {
    return { id, name, segments };
  },
  
  validateFinisher: (segments: MoveSegment[]) => {
    return segments.length > 0 && segments.length <= 5;
  }
};
