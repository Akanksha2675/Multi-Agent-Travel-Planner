import { useState } from "react";
import { usePlanTrip, TripRequest, TripPlan } from "@workspace/api-client-react";
import { TripRequestForm } from "@/components/TripRequestForm";
import { AgentActivityFeed } from "@/components/AgentActivityFeed";
import { BudgetProgressBar } from "@/components/BudgetProgressBar";
import { ItineraryDayCard } from "@/components/ItineraryDayCard";
import { TransportCard } from "@/components/TransportCard";
import { HotelCard } from "@/components/HotelCard";
import { ExecutionerPanel } from "@/components/ExecutionerPanel";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthUser } from "@/hooks/use-auth";

interface Props {
  user: AuthUser | null;
  onLogout: () => void;
}

export default function Home({ user, onLogout }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const planTripMutation = usePlanTrip({
    mutation: {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to start planning",
          description: error?.data?.error || "An unexpected error occurred",
          variant: "destructive",
        });
      },
    },
  });

  const handleFormSubmit = (data: TripRequest) => {
    planTripMutation.mutate({ data });
  };

  const { agents: streamAgents, trip: streamTrip, logs, isConnected, bookingSteps } =
    useAgentStream(sessionId);

  const currentTrip = (
    Object.keys(streamTrip).length > 0 ? streamTrip : {}
  ) as Partial<TripPlan>;

  const currentAgents = streamAgents;

  const isCompleted = currentTrip?.status === "completed" || currentTrip?.status === "booked";
  const bookingStatus = (currentTrip?.bookingStatus as "idle" | "booking" | "booked") ?? "idle";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <h1 className="font-bold tracking-tight text-lg">Trip Planner</h1>
          </div>

          <div className="flex items-center gap-3">
            {sessionId && (
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-green-400" : "bg-amber-400"}`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-green-500" : "bg-amber-500"}`}
                  />
                </span>
                {isConnected ? "Stream Active" : "Polling"}
              </div>
            )}
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-300 hidden sm:flex">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
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

                {(currentTrip?.transport || currentTrip?.hotel) && (
                  <div>
                    {currentTrip.transport && (
                      <TransportCard transport={currentTrip.transport} />
                    )}
                    {currentTrip.hotel && (
                      <HotelCard hotel={currentTrip.hotel} />
                    )}
                  </div>
                )}

                {currentTrip?.days && currentTrip.days.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 mt-2 mb-4">Itinerary</h2>
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

                {isCompleted && (
                  <>
                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                      <h3 className="text-lg font-bold text-green-900 mb-2">
                        {bookingStatus === "booked" ? "Trip Booked!" : "Trip Planning Complete!"}
                      </h3>
                      <p className="text-green-800 text-sm">
                        {bookingStatus === "booked"
                          ? "All bookings confirmed by the Executioner Agent."
                          : "All agents have successfully negotiated and finalized your itinerary within budget."}
                      </p>
                    </div>

                    <ExecutionerPanel
                      sessionId={sessionId}
                      bookingStatus={bookingStatus}
                      bookingSteps={bookingSteps}
                    />
                  </>
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
