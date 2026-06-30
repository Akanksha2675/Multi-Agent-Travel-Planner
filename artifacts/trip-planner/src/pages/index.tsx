import { useState, useEffect } from "react";
import { usePlanTrip, useGetTrip, useGetAgentStatuses, TripRequest, TripPlan, AgentStatus } from "@workspace/api-client-react";
import { TripRequestForm } from "@/components/TripRequestForm";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { BudgetProgressBar } from "@/components/BudgetProgressBar";
import { ItineraryDayCard } from "@/components/ItineraryDayCard";
import { FlightCard } from "@/components/FlightCard";
import { HotelCard } from "@/components/HotelCard";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const planTripMutation = usePlanTrip({
    mutation: {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
      },
      onError: (error) => {
        toast({
          title: "Failed to start planning",
          description: error.error || "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const handleFormSubmit = (data: TripRequest) => {
    planTripMutation.mutate({ data });
  };

  // SSE Stream
  const { agents: streamAgents, trip: streamTrip, logs, isConnected } = useAgentStream(sessionId);

  // Fallback Polling
  const { data: polledTrip } = useGetTrip(sessionId || "", {
    query: {
      enabled: !!sessionId && (!isConnected || (streamTrip && streamTrip.status !== "completed")),
      refetchInterval: 3000,
    }
  });

  const { data: polledAgents } = useGetAgentStatuses(sessionId || "", {
    query: {
      enabled: !!sessionId && !isConnected,
      refetchInterval: 3000,
    }
  });

  // Merge Stream and Polling data, preferring Stream
  const currentTrip = (Object.keys(streamTrip).length > 0 ? streamTrip : polledTrip) as Partial<TripPlan>;
  const currentAgents = (streamAgents.length > 0 ? streamAgents : polledAgents) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold shadow-sm">
              LA
            </div>
            <h1 className="font-bold tracking-tight text-lg">Logistics Agent</h1>
          </div>
          <div className="flex items-center gap-3">
            {sessionId && (
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                </span>
                {isConnected ? 'Stream Active' : 'Polling'}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Form & Itinerary */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <TripRequestForm 
            onSubmit={handleFormSubmit} 
            isSubmitting={planTripMutation.isPending} 
          />

          {sessionId && (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {currentTrip?.budget && (
                  <BudgetProgressBar budget={currentTrip.budget} />
                )}

                {(currentTrip?.flight || currentTrip?.hotel) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTrip.flight && <FlightCard flight={currentTrip.flight} />}
                    {currentTrip.hotel && <HotelCard hotel={currentTrip.hotel} />}
                  </div>
                )}

                {currentTrip?.days && currentTrip.days.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">Itinerary</h2>
                    {currentTrip.days.map((day, index) => (
                      <ItineraryDayCard key={day.day} day={day} index={index} />
                    ))}
                  </div>
                ) : (
                  currentTrip?.status === "planning" && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-sm font-medium">Agents are structuring your itinerary...</p>
                    </div>
                  )
                )}

                {currentTrip?.status === "completed" && (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center mt-8">
                    <h3 className="text-lg font-bold text-green-900 mb-2">Trip Planning Complete!</h3>
                    <p className="text-green-800 text-sm">All agents have successfully negotiated and finalized your itinerary within budget.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Right Column: Agent Activity Feed */}
        <div className="lg:col-span-4 lg:h-[calc(100vh-6rem)] sticky top-20">
          {sessionId ? (
            <AgentActivityFeed agents={currentAgents} logs={logs} />
          ) : (
            <div className="h-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-8 text-center">
              <p className="text-slate-500 text-sm">
                Submit a trip request to initialize the agent swarm.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
