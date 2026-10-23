import { HydratedDocument, Schema } from "mongoose";

export enum AgentType {
  SINGLE = "SINGLE",
  MULTI = "MULTI",
}

export enum AgentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum AgentExecutionPattern {
  HANDOFF = "HANDOFF",
}

export interface AgentScope {
  type: string;
}

export interface AgentModelConfig {
  provider: string;
  deploymentKey: string;
  temperature: number;
}

export interface AgentToolReference {
  toolId: string;
  enabled: boolean;
}

export interface AgentMcp {
  mcpId: string;
  allowedTools: string[];
}

export interface AgentSkill {
  skillId: string;
  enabled: boolean;
}

export interface AgentKnowledgeBase {
  kbId: string;
  enabled: boolean;
}

export interface AgentMember {
  agentId: string;
  enabled: boolean;
}

export interface MultiAgentHandoffRoute {
  fromAgentId: string;
  toAgentIds: string[];
}

export interface MultiAgentHandoff {
  allowedRoutes: MultiAgentHandoffRoute[];
  maxHops: number;
  maxIterations: number;
}

export interface AgentExecutionStrategy {
  pattern: AgentExecutionPattern;
  orchestratorAgentId: string;
  handoff: MultiAgentHandoff;
}

export interface Personality {
  formalityLevel?: string;
  languageComplexity?: string;
  responseLength?: string;
  expressiveStyle?: string;
  [key: string]: unknown;
}

export interface Agents {
  agentId: string;
  type: AgentType;
  name: string;
  version: number;
  description?: string;
  scope?: AgentScope;
  status: AgentStatus;
  model?: AgentModelConfig;
  systemPrompt?: string;
  tools?: AgentToolReference[];
  mcp?: AgentMcp[];
  skills?: AgentSkill[];
  knowledgebase?: AgentKnowledgeBase[];
  agents?: AgentMember[];
  executionStrategy?: AgentExecutionStrategy;
  personality : Personality;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MultiAgentDocument = HydratedDocument<Agents>;

const AgentScopeSchema = new Schema<AgentScope>(
  {
    type: { type: String, required: true },
  },
  { _id: false }
);

const AgentModelConfigSchema = new Schema<AgentModelConfig>(
  {
    provider: { type: String, required: true },
    deploymentKey: { type: String, required: true },
    temperature: { type: Number, required: true },
  },
  { _id: false }
);

const AgentToolSchema = new Schema<AgentToolReference>(
  {
    toolId: { type: String, required: true },
    enabled: { type: Boolean, required: true },
  },
  { _id: false }
);

const AgentMcpSchema = new Schema<AgentMcp>(
  {
    mcpId: { type: String, required: true },
    allowedTools: { type: [String], required: true },
  },
  { _id: false }
);

const AgentSkillSchema = new Schema<AgentSkill>(
  {
    skillId: { type: String, required: true },
    enabled: { type: Boolean, required: true },
  },
  { _id: false }
);

const AgentKnowledgeBaseSchema = new Schema<AgentKnowledgeBase>(
  {
    kbId: { type: String, required: true },
    enabled: { type: Boolean, required: true },
  },
  { _id: false }
);

const AgentMemberSchema = new Schema<AgentMember>(
  {
    agentId: { type: String, required: true },
    enabled: { type: Boolean, required: true },
  },
  { _id: false }
);

const MultiAgentHandoffRouteSchema = new Schema<MultiAgentHandoffRoute>(
  {
    fromAgentId: { type: String, required: true },
    toAgentIds: { type: [String], required: true },
  },
  { _id: false }
);

const MultiAgentHandoffSchema = new Schema<MultiAgentHandoff>(
  {
    allowedRoutes: { type: [MultiAgentHandoffRouteSchema], required: true },
    maxHops: { type: Number, required: true },
    maxIterations: { type: Number, required: true },
  },
  { _id: false }
);

const PersonalitySchema = new Schema<Personality>(
  {
    formalityLevel: { type: String, required: false },
    languageComplexity: { type: String, required: false },
    responseLength: { type: String, required: false },
    expressiveStyle: { type: String, required: false },
  },
  { _id: false }
);

const AgentExecutionStrategySchema =
  new Schema<AgentExecutionStrategy>(
    {
      pattern: {
        type: String,
        enum: Object.values(AgentExecutionPattern),
        required: true,
      },
      orchestratorAgentId: { type: String, required: true },
      handoff: { type: MultiAgentHandoffSchema, required: true },
    },
    { _id: false }
  );

export const AgentSchema = new Schema<Agents>({
  agentId: { type: String, required: true, index: true, unique: true },
  type: { type: String, enum: Object.values(AgentType), required: true },
  name: { type: String, required: true },
  version: { type: Number, required: true },
  description: { type: String, required: false },
  scope: { type: AgentScopeSchema, required: false },
  status: {
    type: String,
    enum: Object.values(AgentStatus),
    required: true,
  },
  model: { type: AgentModelConfigSchema, required: false },
  systemPrompt: { type: String, required: false },
  tools: { type: [AgentToolSchema], required: false, },
  mcp: { type: [AgentMcpSchema], required: false },
  skills: { type: [AgentSkillSchema], required: false },
  knowledgebase: {
    type: [AgentKnowledgeBaseSchema],
    required: false,
    default: [],
  },
  agents: { type: [AgentMemberSchema], required: false },
  executionStrategy: {
    type: AgentExecutionStrategySchema,
    required: false,
  },
   personality: {
    type: PersonalitySchema,
    required: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AgentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

AgentSchema.index({ name: 1 });
// AgentSchema.index({ status: 1 });

export const AgentModelName = "agents";
 