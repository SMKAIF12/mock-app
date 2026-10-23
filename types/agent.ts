export type AgentType = "SINGLE" | "MULTI";

export type AgentStatus = "active" | "inactive" | "draft";

export type ExecutionStrategy =
  | "SEQUENTIAL"
  | "PARALLEL"
  | "ROUTER";

export interface Personality {
  formalityLevel?: string;
  languageComplexity?: string;
  responseLength?: string;
  expressiveStyle?: string;
  [key: string]: unknown;
}

export interface Agent {
  botPersonality?: Personality;
  agentId: string;
  name: string;
  description: string;
  type: AgentType;
  version: number;
  status: AgentStatus;
  scope: {
    type: "platform" | "client";
  };
  model: {
    provider: string;
    deploymentKey: string;
    temperature: number;
  };
  systemPrompt: string;
  tools: {
    toolId: string;
    enabled: boolean;
  }[];
  mcp: {
    mcpId: string;
    allowedTools: string[];
  }[];
  skills: {
    skillId: string;
    enabled: boolean;
  }[];
  knowledgebase: {
    kbId: string;
    enabled: boolean;
  }[];
  agents?: {
    agentId: string;
    order?: number;
  }[];
  executionStrategy?: ExecutionStrategy;
  createdAt: string;
  updatedAt: string;
}