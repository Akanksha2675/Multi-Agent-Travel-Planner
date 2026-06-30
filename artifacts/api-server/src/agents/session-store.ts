import { SessionState, TripRequest, AgentStatus, SSEEventType } from "./types.js";
import { v4 as uuidv4 } from "uuid";

const sessions = new Map<string, SessionState>();

const AGENT_DEFS = [
  { agentId: "orchestrator", name: "Orchestrator" },
  { agentId: "transport", name: "Transport Agent" },
  { agentId: "hotels", name: "Hotels Agent" },
  { agentId: "activities", name: "Activities Agent" },
  { agentId: "budget", name: "Budget Agent" },
  { agentId: "executioner", name: "Executioner Agent" },
];

export function createSession(request: TripRequest): SessionState {
  const sessionId = uuidv4();
  const now = new Date().toISOString();

  const agents = new Map<string, AgentStatus>();
  for (const def of AGENT_DEFS) {
    agents.set(def.agentId, {
      agentId: def.agentId,
      name: def.name,
      status: "idle",
      currentTask: null,
      lastMessage: null,
      updatedAt: now,
    });
  }

  const session: SessionState = {
    sessionId,
    status: "planning",
    request,
    plan: {
      sessionId,
      status: "planning",
      request,
      days: [],
      budget: {
        totalBudget: request.budget,
        spent: 0,
        remaining: request.budget,
        transport: 0,
        hotel: 0,
        activities: 0,
        miscellaneous: 0,
      },
      agents: [],
      createdAt: now,
      completedAt: null,
      bookingStatus: "idle",
    },
    agents,
    createdAt: now,
    completedAt: null,
    sseClients: new Set(),
  };

  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

export function broadcast(session: SessionState, event: SSEEventType): void {
  for (const client of session.sseClients) {
    try {
      client(event);
    } catch {
      session.sseClients.delete(client);
    }
  }
}

export function updateAgent(
  session: SessionState,
  agentId: string,
  update: Partial<AgentStatus>
): AgentStatus {
  const existing = session.agents.get(agentId)!;
  const updated: AgentStatus = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  };
  session.agents.set(agentId, updated);

  broadcast(session, { type: "agent_update", agent: updated });

  session.plan.agents = Array.from(session.agents.values());

  return updated;
}
