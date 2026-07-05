import { StateGraph, END } from "@langchain/langgraph";

export interface SocialSimulationState {
  targetNodes: string[];
  socialStrategy: string;
  networkGraph: Record<string, string[]>;
  simulationLogs: string[];
  stabilizedProbability: number;
}

async function socialArchitectNode(state: SocialSimulationState) {
  const log = `Social Architect: Analyzin behavioral patterns for strategy: ${state.socialStrategy}`;
  return {
    simulationLogs: [...state.simulationLogs, log],
    stabilizedProbability: 0.72
  };
}

async function entanglementWeaverNode(state: SocialSimulationState) {
  const log = "Entanglement Weaver: Mappin node connection loops and influence cascades";
  const adjustedProb = state.stabilizedProbability * 1.15;
  return {
    simulationLogs: [...state.simulationLogs, log],
    stabilizedProbability: Math.min(adjustedProb, 1.0)
  };
}

function shouldContinueSimulation(state: SocialSimulationState) {
  if (state.stabilizedProbability >= 0.90 || state.simulationLogs.length > 5) {
    return "end";
  }
  return "weave";
}

export const buildSocialEngineGraph = () => {
  const workflow = new StateGraph<SocialSimulationState>({
    channels: {
      targetNodes: { value: (x: string[], y: string[]) => y ?? x, default: () => [] },
      socialStrategy: { value: (x: string, y: string) => y ?? x, default: () => "" },
      networkGraph: { value: (x: Record<string, string[]>, y: Record<string, string[]>) => y ?? x, default: () => ({}) },
      simulationLogs: { value: (x: string[], y: string[]) => x.concat(y), default: () => [] },
      stabilizedProbability: { value: (x: number, y: number) => y ?? x, default: () => 0 }
    }
  })
    .addNode("architect", socialArchitectNode)
    .addNode("weaver", entanglementWeaverNode);

  workflow.setEntryPoint("architect");
  
  workflow.addEdge("architect", "weaver");
  workflow.addConditionalEdges("weaver", shouldContinueSimulation, {
    weave: "architect",
    end: END
  });

  return workflow.compile();
};
