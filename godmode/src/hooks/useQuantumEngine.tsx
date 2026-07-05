import React, { useState, useCallback, createContext, useContext } from 'react';
import { QuantumState, ComplexNumber } from '../lib/quantum/StateVectorEngine';

export interface QuantumEngineContextType {
  qState: QuantumState;
  applyHadamard: (targetQubit: number) => void;
  entangle: (controlQubit: number, targetQubit: number) => void;
  measureAndCollapse: () => number;
  collapsedState: number | null;
}

export const QuantumEngineContext = createContext<QuantumEngineContextType | null>(null);

export function useQuantumEngineContext() {
  const context = useContext(QuantumEngineContext);
  if (!context) {
    throw new Error('useQuantumEngineContext must be used within a QuantumEngineProvider');
  }
  return context;
}

export function QuantumEngineProvider({ children }: { children: React.ReactNode }) {
  const engine = useQuantumEngine(3);
  return (
    <QuantumEngineContext.Provider value={engine}>
      {children}
    </QuantumEngineContext.Provider>
  );
}

export function useQuantumEngine(numQubits: number = 3) {
  const [qState, setQState] = useState(() => new QuantumState(numQubits));
  const [collapsedState, setCollapsedState] = useState<number | null>(null);

  const cloneState = (state: QuantumState) => {
    const newState = new QuantumState(numQubits);
    newState.amplitudes = state.amplitudes.map(amp => new ComplexNumber(amp.real, amp.imag));
    return newState;
  };

  const applyHadamard = useCallback((targetQubit: number) => {
    setQState(prev => {
      const newState = cloneState(prev);
      newState.applyHadamard(targetQubit, numQubits);
      return newState;
    });
  }, [numQubits]);

  const entangle = useCallback((controlQubit: number, targetQubit: number) => {
    setQState(prev => {
      const newState = cloneState(prev);
      newState.entangle(controlQubit, targetQubit, numQubits);
      return newState;
    });
  }, [numQubits]);

  const measureAndCollapse = useCallback(() => {
    let result = 0;
    setQState(prev => {
      const tempState = cloneState(prev);
      result = tempState.measureAndCollapse();
      setCollapsedState(result);
      
      const resetState = new QuantumState(numQubits);
      resetState.amplitudes = resetState.amplitudes.map((_, idx) => 
        idx === result ? new ComplexNumber(1, 0) : new ComplexNumber(0, 0)
      );
      return resetState;
    });
    return result;
  }, [numQubits]);

  return {
    qState,
    applyHadamard,
    entangle,
    measureAndCollapse,
    collapsedState
  };
}
