import { Router } from "express";
import { createSession, getSession, updateAgent } from "../agents/session-store.js";
import { runOrchestrator } from "../agents/orchestrator.js";
import { PlanTripBody } from "@workspace/api-zod";
import { logger } from "../lib/logger.js";

const router = Router();

// POST /api/plan-trip — kick off agent flow
router.post("/plan-trip", async (req, res) => {
  const parsed = PlanTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const session = createSession({
    ...data,
    startDate: data.startDate instanceof Date ? data.startDate.toISOString().split("T")[0] : String(data.startDate),
    endDate: data.endDate instanceof Date ? data.endDate.toISOString().split("T")[0] : String(data.endDate),
  });

  // Fire and forget — orchestrator runs async
  runOrchestrator(session).catch((err) => {
    logger.error({ err, sessionId: session.sessionId }, "Orchestrator error");
  });

  res.status(202).json({
    sessionId: session.sessionId,
    status: session.status,
    createdAt: session.createdAt,
    request: session.request,
  });
});

// GET /api/trip-stream/:sessionId — SSE stream
router.get("/trip-stream/:sessionId", (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial state
  send({
    type: "trip_update",
    trip: {
      ...session.plan,
      agents: Array.from(session.agents.values()),
    },
  });

  const client = (event: object) => send(event);
  session.sseClients.add(client as any);

  // If already completed, send complete immediately
  if (session.status === "completed" || session.status === "failed") {
    send({ type: "complete", trip: session.plan });
    res.end();
    return;
  }

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    session.sseClients.delete(client as any);
  });
});

// GET /api/trips/:sessionId — get trip plan
router.get("/trips/:sessionId", (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status === "planning") {
    res.status(202).json({
      sessionId: session.sessionId,
      status: session.status,
      createdAt: session.createdAt,
      request: session.request,
    });
    return;
  }

  res.json({
    ...session.plan,
    agents: Array.from(session.agents.values()),
  });
});

// GET /api/trips/:sessionId/agents — agent statuses
router.get("/trips/:sessionId/agents", (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(Array.from(session.agents.values()));
});

export default router;
