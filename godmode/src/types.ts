export type MoveCategory = "Strike" | "Grapple" | "Submission" | "Aerial" | "Technical" | "General";

export interface WrestlingMove {
  id: string;
  name: string;
  category: MoveCategory;
  damage: number;
  staminaCost: number;
  startupFrames: number;
  description: string;
  cagematchUrl?: string;
  inventedBy?: string;
  styleRating?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "armada" | "model" | "system";
  content: string;
  timestamp: Date | string;
  nodeUsed?: string;
  intent?: string;
  toolCalls?: ToolCall[];
  attachedFiles?: AttachedFile[];
  mediaUrls?: string[];
}

export interface ModelProvider {
  id: string;
  name?: string;
  models?: string[];
  endpoint?: string;
}

export interface TrajectoryData {
  time: string;
  value: number;
}

export interface FieldLog {
  id?: string;
  outcome: string;
  negentropyDelta: number;
  note?: string;
  notes?: string;
  vector?: string;
  initialStrategy?: string;
  timestamp?: any;
}


export type ArmadaNode = string;

export const PROVIDERS: ModelProvider[] = [
  { id: "ouroboros_local", name: "Ouroboros Engine (Local Swarm)", models: ["deepseek-v3", "qwen-2.5-coder", "llama-3", "qwable-3.6-27b"] },
  { id: "gemini", name: "Gemini", models: ["gemini-pro"] },
  { id: "openai", name: "OpenAI", models: ["gpt-4-turbo"] },
  { id: "anthropic", name: "Anthropic", models: ["claude-3-opus"] },
  { id: "cohere", name: "Cohere", models: ["command-r"] },
  { id: "openrouter", name: "OpenRouter", models: ["auto"] }
];

export interface ToolCall {
  id: string;
  name: string;
  arguments: string | any;
  status?: string;
  logs?: string[] | any;
}

export interface AttachedFile {
  name: string;
  content?: string;
  type: string;
  base64?: string;
  size?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  createdAt: number;
}
