import { AgentStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Plane, Train, Car, Building2, Map, Calculator, Loader2, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  agent: AgentStatus;
}

const getAgentIcon = (agentId: string, name: string) => {
  if (agentId === "transport" || name.toLowerCase().includes("transport")) {
    return <Plane className="h-5 w-5" />;
  }
  if (agentId === "executioner" || name.toLowerCase().includes("execut")) {
    return <Rocket className="h-5 w-5" />;
  }
  if (name.toLowerCase().includes("hotel")) return <Building2 className="h-5 w-5" />;
  if (name.toLowerCase().includes("activit")) return <Map className="h-5 w-5" />;
  if (name.toLowerCase().includes("budget")) return <Calculator className="h-5 w-5" />;
  return <Bot className="h-5 w-5" />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "idle": return "bg-slate-300";
    case "working": return "bg-amber-400";
    case "approved": return "bg-green-500";
    case "done": return "bg-green-500";
    case "rejected": return "bg-red-500";
    case "retrying": return "bg-amber-500";
    default: return "bg-slate-300";
  }
};

const getIconColors = (agentId: string, isWorking: boolean) => {
  if (isWorking) return "bg-amber-100 text-amber-700";
  if (agentId === "executioner") return "bg-primary/10 text-primary";
  return "bg-slate-100 text-slate-700";
};

export function AgentStatusCard({ agent }: Props) {
  const isWorking = agent.status === "working" || agent.status === "retrying";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border shadow-sm overflow-hidden bg-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-md ${getIconColors(agent.agentId, isWorking)}`}>
              {isWorking
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : getAgentIcon(agent.agentId, agent.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm text-slate-900">{agent.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 capitalize">{agent.status}</span>
                  <span className="relative flex h-2.5 w-2.5">
                    {isWorking && (
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(agent.status)}`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor(agent.status)}`} />
                  </span>
                </div>
              </div>

              {agent.currentTask && (
                <p className="text-xs text-slate-600 font-medium mb-1 truncate">{agent.currentTask}</p>
              )}
              {agent.lastMessage && (
                <p className="text-xs text-slate-500 line-clamp-2">{agent.lastMessage}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
