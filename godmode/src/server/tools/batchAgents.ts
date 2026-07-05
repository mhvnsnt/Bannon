import { Send } from "@langchain/langgraph";

export interface NetworkSimulationState {
  targetFiles: string[];
}

// Inside your main routing node
export function mapCodebaseReview(state: NetworkSimulationState) {
  // Split the massive structural mapping task into independent parallel agents
  return state.targetFiles.map(file => 
    new Send("structural_analyzer_agent", { targetFile: file })
  );
}
