 "use client";

import { useMemo, useState } from "react";
import type { Agent, AgentType, ExecutionStrategy } from "@/types/agent";
import "@/components/AgentDashboard.light.css";

import { ArrowLeft } from "lucide-react";
// Replace these sample catalogs with API responses when integrating your backend.
const availableModels = [
  { id: "gpt-5.1", name: "GPT-5.1", provider: "azureOpenAi", deployments: [
    { key: "dep-gpt-5-1", name: "GPT-5.1 · Default", region: "East US" },
    { key: "dep-gpt-5.1-australiaeast", name: "GPT-5.1 · Australia East", region: "Australia East" }
  ] },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "azureOpenAi", deployments: [
    { key: "dep-gpt-4-1-eastus", name: "GPT-4.1 · East US", region: "East US" },
    { key: "dep-gpt-4-1-swedencentral", name: "GPT-4.1 · Sweden Central", region: "Sweden Central" }
  ] },
  { id: "gpt-4o", name: "GPT-4o", provider: "azureOpenAi", deployments: [
    { key: "dep-gpt-4o-eastus", name: "GPT-4o · East US", region: "East US" }
  ] }
];
const availableTools = [
  { id: "tool-product-search", name: "Product Search", description: "Find products and product information" },
  { id: "tool-support-search", name: "Support Search", description: "Search support articles and FAQs" },
  { id: "tool-order-draft", name: "Order Draft", description: "Create a draft customer order" },
  { id: "tool-catalog-search", name: "Catalog Search", description: "Query the product catalog" }
];
const availableMcpServers = [
  { id: "mcp-autocount", name: "AutoCount MCP", description: "Customer and product operations", tools: ["getCustomer", "getProduct", "createOrder", "getInvoice"] },
  { id: "mcp-salesforce", name: "Salesforce MCP", description: "CRM operations", tools: ["getLead", "createLead", "getOpportunity"] },
  { id: "mcp-github", name: "GitHub MCP", description: "Repository operations", tools: ["listIssues", "getPullRequest", "searchRepositories"] }
];
const availableSkills = [
  { id: "skill-sales-guidelines", name: "Sales Guidelines", description: "Sales conversation best practices" },
  { id: "skill-assist-order", name: "Order Assistance", description: "Help customers with orders" },
  { id: "skill-customer-support", name: "Customer Support", description: "Troubleshooting and escalation" },
  { id: "skill-research", name: "Research", description: "Research and synthesis workflows" }
];


const initialAgents: Agent[] = [
  {
    agentId: "sales-agent",
    name: "Sales Agent",
    description: "Answers product questions and supports sales workflows.",
    type: "SINGLE",
    version: 1,
    status: "active",
    scope: { type: "platform" },
    model: {
      provider: "azureOpenAi",
      deploymentKey: "dep-gpt-5-1",
      temperature: 0.2
    },
    systemPrompt:
      "You are a helpful sales assistant. Follow tool permissions and use approved knowledge sources.",
    tools: [{ toolId: "tool-product-search", enabled: true }],
    mcp: [
      {
        mcpId: "mcp-autocount",
        allowedTools: ["getCustomer", "getProduct"]
      }
    ],
    skills: [{ skillId: "skill-sales-guidelines", enabled: true }],
    knowledgebase: [
      { kbId: "kb-itrade-products", enabled: true }
    ],
    createdAt: "2026-10-13T09:00:00Z",
    updatedAt: "2026-10-13T09:00:00Z"
  },
  {
    agentId: "support-agent",
    name: "Support Agent",
    description: "Handles customer support queries and resolves issues.",
    type: "SINGLE",
    version: 1,
    status: "active",
    scope: { type: "platform" },
    model: {
      provider: "azureOpenAi",
      deploymentKey: "dep-gpt-5-1",
      temperature: 0.2
    },
    systemPrompt: "You are a helpful support assistant.",
    tools: [{ toolId: "tool-support-search", enabled: true }],
    mcp: [],
    skills: [],
    knowledgebase: [],
    createdAt: "2026-10-12T16:32:00Z",
    updatedAt: "2026-10-12T16:32:00Z"
  },
  {
    agentId: "research-agent",
    name: "Research Agent",
    description: "Searches and summarizes information from knowledge sources.",
    type: "SINGLE",
    version: 1,
    status: "inactive",
    scope: { type: "platform" },
    model: {
      provider: "azureOpenAi",
      deploymentKey: "dep-gpt-5-1",
      temperature: 0.2
    },
    systemPrompt: "You are a research assistant.",
    tools: [],
    mcp: [],
    skills: [],
    knowledgebase: [],
    createdAt: "2026-10-08T14:15:00Z",
    updatedAt: "2026-10-08T14:15:00Z"
  }
];

const navItems = [
  ["✦", "Agents"],
  ["⌘", "Tools"],
  ["◈", "MCP"],
  ["◇", "Skills"],
  ["▣", "Knowledge Base"],
  ["⚙", "Settings"]
];

const strategyInfo: {
  value: ExecutionStrategy;
  title: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    value: "SEQUENTIAL",
    title: "Sequential",
    description:
      "Agents run in order. Each agent's output can be passed to the next agent.",
    recommended: true
  },
  {
    value: "PARALLEL",
    title: "Parallel",
    description:
      "All selected agents run simultaneously and their outputs are combined."
  },
  {
    value: "ROUTER",
    title: "Router",
    description:
      "A routing agent decides which agent should be invoked based on the task."
  }
];

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [configureId, setConfigureId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | AgentType>("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterScope, setFilterScope] = useState("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "agentId" | "createdAt" | "updatedAt" | "status" | "type">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredAgents = useMemo(() => {
    const matching = agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.agentId.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        filterType === "ALL" || agent.type === filterType;
      const matchesStatus = filterStatus === "ALL" || agent.status === filterStatus;
      const matchesScope = filterScope === "ALL" || agent.scope?.type === filterScope;
      return matchesSearch && matchesType && matchesStatus && matchesScope;
    });
    return matching.sort((a, b) => {
      const aValue = String(a[sortBy] ?? "");
      const bValue = String(b[sortBy] ?? "");
      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [agents, search, filterType, filterStatus, filterScope, sortBy, sortDirection]);

  const configuredAgent = agents.find(
    (agent) => agent.agentId === configureId
  );

  const createAgent = (name: string, description: string) => {
    const now = new Date().toISOString();
    const newAgent: Agent = {
      agentId: crypto.randomUUID(),
      name,
      description,
      type: "SINGLE",
      version: 1,
      status: "draft",
      scope: { type: "platform" },
      model: {
        provider: "",
        deploymentKey: "",
        temperature: 0.2
      },
      systemPrompt: "",
      tools: [],
      mcp: [],
      skills: [],
      knowledgebase: [],
      createdAt: now,
      updatedAt: now
    };

    setAgents((current) => [newAgent, ...current]);
    setCreateOpen(false);
    setConfigureId(newAgent.agentId);
  };

  const updateAgent = (updated: Agent) => {
    setAgents((current) =>
      current.map((agent) =>
        agent.agentId === updated.agentId ? updated : agent
      )
    );
  };

  const deleteAgent = (agentId: string) => {
    setAgents((current) => current.filter((agent) => agent.agentId !== agentId));
    if (configureId === agentId) setConfigureId(null);
    setDeleteId(null);
  };

  const agentToDelete = agents.find((agent) => agent.agentId === deleteId);

  return (
    <div className="app-shell portal-theme">
      <PortalHeader />
      <div className="portal-layout">
      <Sidebar />
      <main className="main">
        <div className="breadcrumbs"><span>Home</span><span>›</span><span>AI Services</span><span>›</span><strong>Agents</strong>{configuredAgent && <><span>›</span><strong>Configure</strong></>}</div>
        <div className={`main-content ${configuredAgent ? "main-content--builder" : ""}`}>
        {configuredAgent ? (
          <ConfigurePanel
            key={configuredAgent.agentId}
            agent={configuredAgent}
            allAgents={agents}
            onClose={() => setConfigureId(null)}
            onSave={updateAgent}
          />
        ) : (<>
        <header className="topbar">
          <div className="heading-icon">♙</div>
          <div>
            <h1>AI Agents</h1>
            <p>Create and manage AI agents to automate your workflows.</p>
          </div>

        </header>

        <section className="agents-toolbar-wrap">
          <div className="toolbar agents-toolbar">
            <div className="search"><span>⌕</span><input aria-label="Search agents" placeholder="Search agent name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <button type="button" className={`secondary-button agents-filter-toggle ${filtersOpen ? "is-open" : ""}`} aria-expanded={filtersOpen} aria-controls="agent-filter-options" onClick={() => setFiltersOpen(open => !open)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5L4 5Z"/></svg>
              Filters {([filterStatus, filterType, filterScope].filter(value => value !== "ALL").length > 0) && <span className="filter-count">{[filterStatus, filterType, filterScope].filter(value => value !== "ALL").length}</span>}
            </button>
            <button type="button" className={`secondary-button agents-sort-toggle ${sortOpen ? "is-open" : ""}`} aria-expanded={sortOpen} aria-controls="agent-sort-options" onClick={() => setSortOpen(open => !open)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h13M4 12h9M4 17h5M17 14v7m0 0-3-3m3 3 3-3"/></svg>
              Sort
            </button>
            <button type="button" className="secondary-button agents-refresh" title="Reset search and filters" aria-label="Reset search and filters" onClick={() => { setSearch(""); setFilterStatus("ALL"); setFilterType("ALL"); setFilterScope("ALL"); setSortBy("updatedAt"); setSortDirection("desc"); }}>↻</button>
            <button type="button" className="primary-button agents-create" onClick={() => setCreateOpen(true)}>＋ Create Agent</button>
          </div>
          {sortOpen && <div id="agent-sort-options" className="agents-sort-panel">
            <label>SORT BY<select aria-label="Sort agents by" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="updatedAt">Updated At</option><option value="createdAt">Created At</option><option value="name">Agent Name</option><option value="agentId">Agent ID</option><option value="status">Status</option><option value="type">Type</option>
            </select></label>
            <label>ORDER<select aria-label="Sort direction" value={sortDirection} onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}>
              <option value="desc">Descending (Z–A / Newest first)</option><option value="asc">Ascending (A–Z / Oldest first)</option>
            </select></label>
          </div>}
          {filtersOpen && <div id="agent-filter-options" className="agents-filter-panel">
            <label>STATUS<select aria-label="Filter by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="ALL">All Statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            <label>TYPE<select aria-label="Filter by type" value={filterType} onChange={(e) => setFilterType(e.target.value as "ALL" | AgentType)}><option value="ALL">All Types</option><option value="SINGLE">Single</option><option value="MULTI">Multiple</option></select></label>
            <label>SCOPE<select aria-label="Filter by scope" value={filterScope} onChange={(e) => setFilterScope(e.target.value)}><option value="ALL">All Scopes</option><option value="platform">Platform</option><option value="client">Client</option></select></label>
          </div>}
        </section>

        <section className="table-card">
          <div className="agents-table-scroll" role="region" aria-label="Agents list" tabIndex={0}>
          <div className="table-head">
            <span>Name</span>
            <span>Agent ID</span>
            <span>Type</span>
            <span>Version</span>
            <span>Status</span>
            <span>Scope</span>
            <span>Created At</span>
            <span>Updated At</span>
            <span>Actions</span>
          </div>

          {filteredAgents.map((agent) => (
            <div className="table-row" key={agent.agentId}>
              <div className="agent-cell">
                <div className="agent-icon">
                  {agent.type === "MULTI" ? "♧" : "♙"}
                </div>
                <div>
                  <strong>{agent.name}</strong>
                  <small>{agent.description}</small>
                </div>
              </div>

              <span className="agent-id-cell" title={agent.agentId}>{agent.agentId}</span>
              <span className="pill">{agent.type}</span>
              <span>{agent.version.toFixed(1)}</span>

              <span className="status">
                <i className={agent.status} />
                {agent.status === "draft" ? "Draft" : agent.status === "active" ? "Active" : "Inactive"}
              </span>

              <span>{capitalize(agent.scope.type)}</span>

              <span className="date">{agent.createdAt ? formatDate(agent.createdAt) : "—"}</span>
              <span className="date">
                {formatDate(agent.updatedAt)}
              </span>

              <div className="agent-row-actions">
                <button
                  type="button"
                  className="agent-action-icon"
                  aria-label={`Configure ${agent.name}`}
                  title="Configure"
                  onClick={() => setConfigureId(agent.agentId)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a3 3 0 0 0 3 3l2-1 2 2-1 2a3 3 0 0 0 0 6l1 2-2 2-2-1a3 3 0 0 0-6 0l-2 1-2-2 1-2a3 3 0 0 0 0-6L5 7l2-2 2 1a3 3 0 0 0 3-3Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button
                  type="button"
                  className="agent-action-icon danger"
                  aria-label={`Delete ${agent.name}`}
                  title="Delete"
                  onClick={() => setDeleteId(agent.agentId)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>
                </button>
              </div>
            </div>
          ))}

          </div>
          <div className="table-footer">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </section>
        </>)}
        </div>
      </main>
      </div>

      {agentToDelete && (
        <div className="nested-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteId(null); }}>
          <div className="modal delete-agent-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-agent-title" aria-describedby="delete-agent-description">
            <h2 id="delete-agent-title">Delete agent?</h2>
            <p id="delete-agent-description">Are you sure you want to delete <strong>{agentToDelete.name}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="delete-confirm-button" onClick={() => deleteAgent(agentToDelete.agentId)}>Delete agent</button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <CreateAgentModal
          onClose={() => setCreateOpen(false)}
          onCreate={createAgent}
        />
      )}

    </div>
  );
}

function PortalHeader() {
  return <header className="portal-header">
    <div className="portal-brand"><div className="portal-logo">♙</div><strong>iNextLabs</strong><i/><b>Management Portal</b></div>
    <div className="portal-user"><span>ⓘ</span><span>♧</span><span>⚙</span><div className="user-avatar">MS</div><div><strong>Admin</strong><small>Admin</small></div></div>
  </header>;
}

function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  return (
    <aside className="sidebar">
      <nav>
        <div className="nav-item"><span>▦</span>Dashboard</div>
        <div className="nav-section">PLATFORM <span>⌄</span></div>
        {[["♧","Client Account"],["♧","Client Teams"],["▤","AI Resource Catalog"],["▣","Infra Resources"]].map(([icon,label]) => <div className="nav-item" key={label}><span>{icon}</span>{label}</div>)}
        <button className="nav-item nav-parent" onClick={() => setExpanded(!expanded)}><span>♙</span>AI Services <b>{expanded ? "⌄" : "›"}</b></button>
        {expanded && <div className="nav-children">
          {[["♧","MCP Servers"],["♙","Agents"],["⚙","Agent Skills"],["ϟ","Model Registry"],["▤","Docs AI"],["⌁","Insights AI"]].map(([icon,label]) => <div className={`nav-item ${label === "Agents" ? "active" : ""}`} key={label}><span>{icon}</span>{label}</div>)}
        </div>}
        <div className="nav-item"><span>⌁</span>Activity Logs</div>
      </nav>
    </aside>
  );
}

function CreateAgentModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="overlay">
      <div className="modal create-modal">
        <div className="modal-header">
          <div>
            <h2>Create Agent</h2>
            <p>Provide basic details to create a new AI agent.</p>
          </div>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>

        <label>Agent Name <em>*</em></label>
        <input
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter agent name"
        />
        <div className="counter">{name.length}/50</div>

        <label>Description <em>*</em></label>
        <textarea
          value={description}
          maxLength={500}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this agent does"
          rows={5}
        />
        <div className="counter">{description.length}/500</div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={!name.trim() || !description.trim()}
            onClick={() => onCreate(name.trim(), description.trim())}
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigurePanel({
  agent,
  allAgents,
  onClose,
  onSave
}: {
  agent: Agent;
  allAgents: Agent[];
  onClose: () => void;
  onSave: (agent: Agent) => void;
}) {
  const [draft, setDraft] = useState<Agent>(agent);
  const [section, setSection] = useState(
    agent.type === "MULTI" ? "overview" : "overview"
  );
  const [typeDialog, setTypeDialog] = useState(false);
  const [scopeDialog, setScopeDialog] = useState(false);

  // Completion is derived from the current configuration, not a separate UI flag.
  // Optional integrations show a check only when at least one item is selected.
  const configurationSteps = [
    { id: "overview", label: "Overview", description: "Agent details and scope", complete: Boolean(draft.name?.trim() && draft.description?.trim() && draft.type && draft.scope?.type) },
    ...(draft.type === "MULTI" ? [
      { id: "agents", label: "Agents", description: "Participating agents", complete: (draft.agents?.length ?? 0) >= 2 },
      { id: "execution", label: "Execution Strategy", description: "Orchestration method", complete: Boolean(draft.executionStrategy) }
    ] : []),
    { id: "model", label: "Model", description: "Model and deployment", complete: Boolean(draft.model?.provider && draft.model?.deploymentKey) },
    { id: "prompt", label: "System Prompt", description: "Agent instructions", complete: Boolean(draft.systemPrompt?.trim()) },
    { id: "tools", label: "Tools", description: "Enabled tools", complete: Boolean(draft.tools?.some(item => item.enabled)) },
    { id: "mcp", label: "MCP", description: "MCP server tools", complete: Boolean(draft.mcp?.some(item => (item.allowedTools?.length ?? 0) > 0)) },
    { id: "skills", label: "Skills", description: "Assigned skills", complete: Boolean(draft.skills?.some(item => item.enabled)) },
    { id: "knowledge", label: "Knowledge Base", description: "Knowledge sources", complete: Boolean(draft.knowledgebase?.some(item => item.enabled)) }
  ];
  const completedStepCount = configurationSteps.filter(item => item.complete).length;
  const currentStepIndex = configurationSteps.findIndex(item => item.id === section);
  const isFinalStep = currentStepIndex === configurationSteps.length - 1;
  // Integrations are optional. Require the core setup before publishing.
  const requiredStepIds = draft.type === "MULTI"
    ? ["overview", "agents", "execution", "model", "prompt"]
    : ["overview", "model", "prompt"];
  const canSubmit = requiredStepIds.every(id =>
    configurationSteps.find(item => item.id === id)?.complete === true
  );

  const selectedIds =
    draft.agents?.map((item) => item.agentId) ?? [];

  const updateType = (type: AgentType) => {
    if (type === draft.type) return;
    setTypeDialog(false);

    if (type === "MULTI") {
      setDraft({
        ...draft,
        type,
        agents: [],
        executionStrategy: "SEQUENTIAL"
      });
    } else {
      setDraft({
        ...draft,
        type,
        agents: undefined,
        executionStrategy: undefined
      });
      setSection("overview");
    }
  };

  const toggleAgent = (agentId: string) => {
    const current = selectedIds;

    if (current.includes(agentId)) {
      const remaining = current.filter((id) => id !== agentId);
      setDraft({
        ...draft,
        agents: remaining.map((id, index) => ({
          agentId: id,
          order: index + 1
        }))
      });
    } else {
      setDraft({
        ...draft,
        agents: [
          ...(draft.agents ?? []),
          { agentId, order: (draft.agents?.length ?? 0) + 1 }
        ]
      });
    }
  };

  const saveAndContinue = () => {
    onSave({ ...draft, updatedAt: new Date().toISOString() });
    if (!isFinalStep) {
      setSection(configurationSteps[currentStepIndex + 1].id);
    }
  };

  const submitAgent = () => {
    if (!canSubmit) return;
    onSave({
      ...draft,
      status: draft.status === "draft" ? "active" : draft.status,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  const selectedAgentObjects = allAgents.filter((item) =>
    selectedIds.includes(item.agentId)
  );

  return (
    <div className="agent-builder-view wizard-layout">
      <div className="wizard-page-heading">
<button
  type="button"
  className="config-back-button"
  onClick={onClose}
  aria-label="Back to agents"
  title="Back to agents"
>
  <ArrowLeft size={18} strokeWidth={2} />
</button>        <div><h2>{draft.status === "draft" ? "Register AI Agent" : "Configure AI Agent"}</h2><p>Configure agent details and capabilities. Step {currentStepIndex + 1} of {configurationSteps.length}.</p></div>
      </div>
      <div className="configure-panel">
        <div className="config-body">
          <aside className="config-nav" aria-label="Agent configuration steps">
            <div className="wizard-agent-summary">
              <strong>{draft.name}</strong>
              <span className={`active-badge ${draft.status === "draft" ? "draft-badge" : ""}`}>● {capitalize(draft.status)} v{draft.version}</span>
              <small>{completedStepCount} of {configurationSteps.length} steps completed</small>
            </div>
            {configurationSteps.map((step, index) => (
              <button
                type="button"
                key={step.id}
                className={`config-step ${section === step.id ? "selected" : ""} ${step.complete ? "is-complete" : ""}`}
                onClick={() => setSection(step.id)}
                aria-current={section === step.id ? "step" : undefined}
                title={`${step.label}${step.complete ? " — Completed" : ""}`}
              >
                <span className="config-step-marker" aria-hidden="true">
                  {step.complete ? "✓" : index + 1}
                </span>
                <span className="config-step-copy">
                  <strong>{step.label}</strong>
                  <small>{step.description}</small>
                </span>
              </button>
            ))}
          </aside>

          <div className="wizard-content-column">
          <section className="config-content">
            {section === "overview" && (
              <Overview
                agent={draft}
                onChange={setDraft}
                onEditType={() => setTypeDialog(true)}
                onEditScope={() => setScopeDialog(true)}
              />
            )}

            {section === "agents" && draft.type === "MULTI" && (
              <AgentsSection
                allAgents={allAgents}
                currentAgentId={draft.agentId}
                selectedIds={selectedIds}
                selectedAgentObjects={selectedAgentObjects}
                onToggle={toggleAgent}
              />
            )}

            {section === "execution" && draft.type === "MULTI" && (
              <ExecutionSection
                value={draft.executionStrategy ?? "SEQUENTIAL"}
                onChange={(value) =>
                  setDraft({ ...draft, executionStrategy: value })
                }
              />
            )}

            {section === "model" && <ModelSection agent={draft} onChange={setDraft} />}
            {section === "prompt" && <div className="content-card"><div className="section-heading"><div><h2>System Prompt</h2><p>Instructions followed by this agent.</p></div></div><textarea className="catalog-textarea" rows={10} value={draft.systemPrompt} onChange={e => setDraft({ ...draft, systemPrompt: e.target.value })} placeholder="Enter system instructions..." /></div>}
            {section === "tools" && <CatalogMultiSelect title="Available Tools" description="Choose the tools this agent can use." items={availableTools} selected={draft.tools.filter(t => t.enabled).map(t => t.toolId)} onToggle={id => setDraft({ ...draft, tools: toggleIds(draft.tools.filter(t => t.enabled).map(t => t.toolId), id).map(toolId => ({ toolId, enabled: true })) })} />}
            {section === "mcp" && <McpSection agent={draft} onChange={setDraft} />}
            {section === "skills" && <CatalogMultiSelect title="Available Skills" description="Assign one or more skills to this agent." items={availableSkills} selected={draft.skills.filter(s => s.enabled).map(s => s.skillId)} onToggle={id => setDraft({ ...draft, skills: toggleIds(draft.skills.filter(s => s.enabled).map(s => s.skillId), id).map(skillId => ({ skillId, enabled: true })) })} />}
            {section === "knowledge" && <Placeholder title="Knowledge Base" text={`${draft.knowledgebase.filter(k => k.enabled).length} knowledge base(s)`} />}
            {section === "scope" && <Placeholder title="Scope & Settings" text={`Scope: ${capitalize(draft.scope.type)}\nStatus: ${capitalize(draft.status)}`} />}
          </section>

        <div className="config-footer">
          <button type="button" className="wizard-previous-button" disabled={currentStepIndex === 0} onClick={() => setSection(configurationSteps[currentStepIndex - 1].id)}>← Previous</button>
          <span>Step {currentStepIndex + 1} of {configurationSteps.length}</span>
          {isFinalStep ? (
            <button
              type="button"
              className="primary-button"
              disabled={!canSubmit}
              title={!canSubmit ? "Complete Overview, Model, System Prompt and any required multi-agent steps" : undefined}
              onClick={submitAgent}
            >
              {draft.status === "draft" ? "Create Agent" : "Save Changes"}
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={saveAndContinue}>
              Save &amp; Continue →
            </button>
          )}
        </div>
          </div>
        </div>

        {scopeDialog && (
          <div className="nested-overlay">
            <div className="modal type-modal" role="dialog" aria-modal="true" aria-labelledby="change-scope-title">
              <h2 id="change-scope-title">Change Agent Scope</h2>
              <p>Select where this agent will be available.</p>
              <div className="type-options">
                <button
                  type="button"
                  className={draft.scope.type === "platform" ? "type-card current" : "type-card"}
                  onClick={() => {
                    setDraft({ ...draft, scope: { ...draft.scope, type: "platform" } });
                    setScopeDialog(false);
                  }}
                >
                  <b>Platform</b>
                  <span>Available across the platform.</span>
                </button>
                <button
                  type="button"
                  className={draft.scope.type === "client" ? "type-card current" : "type-card"}
                  onClick={() => {
                    setDraft({ ...draft, scope: { ...draft.scope, type: "client" as Agent["scope"]["type"] } });
                    setScopeDialog(false);
                  }}
                >
                  <b>Client</b>
                  <span>Available within a client scope.</span>
                </button>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setScopeDialog(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {typeDialog && (
          <div className="nested-overlay">
            <div className="modal type-modal">
              <h2>Change Agent Type?</h2>
              <p>
                Changing from <strong>{draft.type === "SINGLE" ? "Single" : "Multiple"}</strong>{" "}
                to <strong>{draft.type === "SINGLE" ? "Multiple" : "Single"}</strong>{" "}
                changes the agent orchestration model.
              </p>

              <div className="type-options">
                <button
                  className={draft.type === "SINGLE" ? "type-card current" : "type-card"}
                  onClick={() => updateType("SINGLE")}
                >
                  <b>Single Agent</b>
                  <span>Runs independently.</span>
                </button>

                <button
                  className={draft.type === "MULTI" ? "type-card current" : "type-card"}
                  onClick={() => updateType("MULTI")}
                >
                  <b>Multiple Agents</b>
                  <span>Coordinates existing agents.</span>
                </button>
              </div>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setTypeDialog(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}

function Overview({
  agent,
  onChange,
  onEditType,
  onEditScope
}: {
  agent: Agent;
  onChange: (agent: Agent) => void;
  onEditType: () => void;
  onEditScope: () => void;
}) {
  return (
    <div className="overview-card">
      <div className="section-heading">
        <div>
          <h2>Overview</h2>
          <p>Basic information about this agent.</p>
        </div>
      </div>

      <label>Name</label>
      <input
        value={agent.name}
        maxLength={50}
        onChange={(e) => onChange({ ...agent, name: e.target.value })}
      />
      <div className="counter">{agent.name.length}/50</div>

      <label>Description</label>
      <textarea
        value={agent.description}
        maxLength={500}
        rows={4}
        onChange={(e) =>
          onChange({ ...agent, description: e.target.value })
        }
      />
      <div className="counter">{agent.description.length}/500</div>

      <div className="meta-grid">
        <div>
          <div className="meta-card-heading">
            <span>Agent Type</span>
            <button type="button" className="meta-pencil" onClick={onEditType} title="Edit agent type" aria-label="Edit agent type">
              <PencilIcon />
            </button>
          </div>
          <strong>{agent.type}</strong>
        </div>

        <div>
          <div className="meta-card-heading">
            <span>Scope</span>
            <button type="button" className="meta-pencil" onClick={onEditScope} title="Edit scope" aria-label="Edit scope">
              <PencilIcon />
            </button>
          </div>
          <strong>{capitalize(agent.scope.type)}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong className={agent.status === "active" ? "green" : "yellow"}>● {capitalize(agent.status)}</strong>
        </div>

        <div>
          <span>Version</span>
          <strong>{agent.version.toFixed(1)}</strong>
        </div>
      </div>
    </div>
  );
}

function AgentsSection({
  allAgents,
  currentAgentId,
  selectedIds,
  selectedAgentObjects,
  onToggle
}: {
  allAgents: Agent[];
  currentAgentId: string;
  selectedIds: string[];
  selectedAgentObjects: Agent[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const available = allAgents.filter(
    (agent) =>
      agent.agentId !== currentAgentId &&
      agent.status === "active" &&
      (agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.agentId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="content-card">
      <div className="section-heading">
        <div>
          <h2>Participating Agents</h2>
          <p>Select the existing agents that will work together.</p>
        </div>
        <span className="count-badge">{selectedIds.length} selected</span>
      </div>

      <div className="search full">
        <span>⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search active agents..."
        />
      </div>

      <div className="agent-list">
        {available.map((agent) => {
          const selected = selectedIds.includes(agent.agentId);

          return (
            <button
              className={`agent-option ${selected ? "chosen" : ""}`}
              key={agent.agentId}
              onClick={() => onToggle(agent.agentId)}
            >
              <span className={`checkbox ${selected ? "checked" : ""}`}>
                {selected ? "✓" : ""}
              </span>
              <span className="small-icon">♙</span>
              <span className="agent-option-copy">
                <b>{agent.name}</b>
                <small>{agent.description}</small>
              </span>
              <span className="pill">SINGLE</span>
            </button>
          );
        })}
      </div>

      <div className="selected-block">
        <span>Selected agents</span>
        <div className="chips">
          {selectedAgentObjects.length === 0 ? (
            <small>No agents selected.</small>
          ) : (
            selectedAgentObjects.map((agent) => (
              <span className="chip" key={agent.agentId}>
                {agent.name}
                <button onClick={() => onToggle(agent.agentId)}>×</button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutionSection({
  value,
  onChange
}: {
  value: ExecutionStrategy;
  onChange: (value: ExecutionStrategy) => void;
}) {
  return (
    <div className="content-card">
      <div className="section-heading">
        <div>
          <h2>Execution Strategy</h2>
          <p>Define how the selected agents should work together.</p>
        </div>
      </div>

      <div className="strategy-list">
        {strategyInfo.map((strategy) => {
          const selected = value === strategy.value;

          return (
            <button
              key={strategy.value}
              className={`strategy ${selected ? "chosen" : ""}`}
              onClick={() => onChange(strategy.value)}
            >
              <span className={`radio ${selected ? "checked" : ""}`} />
              <span>
                <strong>{strategy.title}</strong>
                {strategy.recommended && (
                  <em>Recommended</em>
                )}
                <small>{strategy.description}</small>
              </span>
            </button>
          );
        })}
      </div>

      {value === "SEQUENTIAL" && (
        <div className="info-box">
          <b>Execution order</b>
          <p>
            The order is determined by the order in which agents are
            selected. You can later replace this with drag-and-drop ordering.
          </p>
        </div>
      )}
    </div>
  );
}


function toggleIds(current: string[], id: string) {
  return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
}

function ModelSection({ agent, onChange }: { agent: Agent; onChange: (agent: Agent) => void }) {
  const current = availableModels.find(model => model.deployments.some(d => d.key === agent.model.deploymentKey));
  const [modelId, setModelId] = useState(current?.id ?? "");
  const model = availableModels.find(item => item.id === modelId);
  return <div className="content-card catalog-form">
    <div className="section-heading"><div><h2>Model Configuration</h2><p>Select a model first, then choose one of its deployments.</p></div></div>
    <label htmlFor="agent-model">Available Models</label>
    <select id="agent-model" value={modelId} onChange={e => {
      const next = availableModels.find(m => m.id === e.target.value);
      setModelId(e.target.value);
      onChange({ ...agent, model: { ...agent.model, provider: next?.provider ?? "azureOpenAi", deploymentKey: next?.deployments[0]?.key ?? "" } });
    }}><option value="">Select a model</option>{availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
    <label htmlFor="agent-deployment">Available Deployments</label>
    <select id="agent-deployment" value={model?.deployments.some(d => d.key === agent.model.deploymentKey) ? agent.model.deploymentKey : ""} disabled={!model} onChange={e => onChange({ ...agent, model: { ...agent.model, deploymentKey: e.target.value } })}>
      <option value="">Select a deployment</option>{model?.deployments.map(d => <option key={d.key} value={d.key}>{d.name} ({d.region})</option>)}
    </select>
    <label htmlFor="agent-temperature">Temperature</label>
    <input id="agent-temperature" type="number" min="0" max="2" step="0.1" value={agent.model.temperature ?? 0.2} onChange={e => onChange({ ...agent, model: { ...agent.model, temperature: Number(e.target.value) } })} />
    <p className="catalog-hint">Deployment key: {agent.model.deploymentKey || "Not selected"}</p>
  </div>;
}

type CatalogItem = { id: string; name: string; description: string };
function CatalogMultiSelect({ title, description, items, selected, onToggle }: { title: string; description: string; items: CatalogItem[]; selected: string[]; onToggle: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = items.filter(item => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="content-card">
    <div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div><span className="count-badge">{selected.length} selected</span></div>
    <input className="catalog-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search available items..." />
    <div className="catalog-options available-items-scroll" role="region" aria-label={`${title} list`} tabIndex={0}>{visible.map(item => <label className="catalog-option" key={item.id}>
      <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
      <span><strong>{item.name}</strong><small>{item.description}</small><small>{item.id}</small></span>
    </label>)}{visible.length === 0 && <p>No matching items.</p>}</div>
  </div>;
}

function McpSection({ agent, onChange }: { agent: Agent; onChange: (agent: Agent) => void }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggleTool = (serverId: string, tool: string) => {
    const existing = agent.mcp.find(entry => entry.mcpId === serverId);
    const tools = toggleIds(existing?.allowedTools ?? [], tool);
    const other = agent.mcp.filter(entry => entry.mcpId !== serverId);
    onChange({ ...agent, mcp: tools.length ? [...other, { mcpId: serverId, allowedTools: tools }] : other });
  };
  return <div className="content-card">
    <div className="section-heading"><div><h2>MCP Servers & Tools</h2><p>Browse available servers, then select permitted tools for each server.</p></div><span className="count-badge">{agent.mcp.reduce((sum, server) => sum + (server.allowedTools?.length ?? 0), 0)} tools</span></div>
    <input className="catalog-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search MCP servers..." />
    <div className="mcp-servers-scroll available-items-scroll" role="region" aria-label="Available MCP servers" tabIndex={0}>
    {availableMcpServers.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).map(server => {
      const selected = agent.mcp.find(entry => entry.mcpId === server.id)?.allowedTools ?? [];
      const open = expanded.includes(server.id);
      return <div className="mcp-server" key={server.id}>
        <button type="button" className="mcp-server-header" onClick={() => setExpanded(toggleIds(expanded, server.id))} aria-expanded={open}>
          <span><strong>{server.name}</strong><small>{server.description}</small></span><span>{selected.length}/{server.tools.length} tools {open ? "⌃" : "⌄"}</span>
        </button>
        {open && <div className="mcp-tools">{server.tools.map(tool => <label key={tool} className="catalog-option"><input type="checkbox" checked={selected.includes(tool)} onChange={() => toggleTool(server.id, tool)} /><span><strong>{tool}</strong></span></label>)}</div>}
      </div>;
    })}
    </div>
  </div>;
}

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="content-card placeholder">
      <h2>{title}</h2>
      <pre>{text}</pre>
      <p>This section is ready for your existing backend configuration UI.</p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}