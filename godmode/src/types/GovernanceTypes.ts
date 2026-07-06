export enum VetoType {
  APPROVED = 'APPROVED',
  HARD_BLOCK = 'HARD_BLOCK',
  SOFT_BLOCK = 'SOFT_BLOCK'
}

export interface ActionRequest {
  type: string;
  payload: any;
}

export interface CognitiveLock {
  id: string;
  type: string;
  value: any;
}

export interface VetoDecision {
  status: VetoType;
  reason: string;
}
