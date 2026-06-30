import { AgentStatus } from "@workspace/api-client-react";
import { AgentStatusCard } from "./AgentStatusCard";
import { LogMessage } from "@/hooks/use-agent-stream";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  agents: AgentStatus[];
  logs: LogMessage[];
}

export function AgentActivityFeed({ agents, logs }: Props) {
  // Sort agents to show working ones first, then by name
  const sortedAgents = [...agents].sort((a, b) => {
    const isAWorking = a.status === "working" || a.status === "retrying";
    const isBWorking = b.status === "working" || b.status === "retrying";
    if (isAWorking && !isBWorking) return -1;
    if (!isAWorking && isBWorking) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l rounded-tr-xl rounded-br-xl overflow-hidden">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-slate-900">Live Agent Feed</h2>
        <p className="text-xs text-slate-500">Real-time status & negotiation</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Agents</h3>
            <div className="space-y-3">
              {sortedAgents.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No agents active yet...</p>
              ) : (
                <AnimatePresence>
                  {sortedAgents.map(agent => (
                    <AgentStatusCard key={agent.agentId} agent={agent} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Negotiation Log</h3>
            <div className="space-y-3 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-500 italic font-sans">Awaiting messages...</p>
              ) : (
                <AnimatePresence initial={false}>
                  {[...logs].reverse().map(log => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded border ${log.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-white border-slate-200 text-slate-700'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 opacity-70">
                        <span>{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                        {log.fromAgent && log.toAgent && (
                          <span className="font-semibold text-primary">{log.fromAgent} &rarr; {log.toAgent}</span>
                        )}
                      </div>
                      <div className="break-words">
                        {log.message}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
