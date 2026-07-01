import { useEffect, useState, useRef } from "react";
import { AgentStatus, TripPlan } from "@workspace/api-client-react";

export type LogMessage = {
  id: string;
  type: "negotiation" | "info" | "error";
  message: string;
  fromAgent?: string;
  toAgent?: string;
  timestamp: string;
};

export function useAgentStream(sessionId: string | null) {
  const [agents, setAgents] = useState<Record<string, AgentStatus>>({});
  const [trip, setTrip] = useState<Partial<TripPlan>>({});
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSteps, setBookingSteps] = useState<string[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${baseUrl}/api/trip-stream/${sessionId}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "agent_update" && data.agent) {
          setAgents((prev) => ({ ...prev, [data.agent.agentId]: data.agent }));
        } else if (data.type === "trip_update" && data.trip) {
          setTrip((prev) => ({ ...prev, ...data.trip }));
        } else if (data.type === "negotiation") {
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: "negotiation",
              message: data.message,
              fromAgent: data.fromAgent,
              toAgent: data.toAgent,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else if (data.type === "complete" && data.trip) {
          setTrip(data.trip);
        } else if (data.type === "booking_update") {
          if (!data.done) {
            setBookingSteps((prev) => [...prev, data.step]);
          }
          setTrip((prev) => ({
            ...prev,
            bookingStatus: data.done ? "booked" : "booking",
          }));
        } else if (data.type === "error") {
          setError(data.message);
          setLogs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: "error",
              message: data.message,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to parse SSE event", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId]);

  return {
    agents: Object.values(agents),
    trip,
    logs,
    isConnected,
    error,
    bookingSteps,
  };
}
