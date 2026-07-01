import { useState } from "react";
import { useExecuteTrip } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Rocket, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  sessionId: string;
  bookingStatus: "idle" | "booking" | "booked";
  bookingSteps: string[];
}

export function ExecutionerPanel({ sessionId, bookingStatus, bookingSteps }: Props) {
  const [triggered, setTriggered] = useState(false);

  const executeMutation = useExecuteTrip({
    mutation: {
      onSuccess: () => setTriggered(true),
    },
  });

  const handleBook = () => {
    executeMutation.mutate({ sessionId });
  };

  if (bookingStatus === "booked") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2.5 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-900">Trip Booked!</h3>
                <p className="text-sm text-green-700">All items confirmed by Executioner Agent</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {bookingSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 text-sm text-green-800"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {step}
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Demo mode — no real bookings were made. This is a simulated confirmation.</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (bookingStatus === "booking" || triggered) {
    return (
      <Card className="border-primary/20 bg-primary/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2.5 rounded-full">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Executioner Agent working...</h3>
              <p className="text-xs text-slate-500">Simulating booking sequence</p>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {bookingSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-slate-700 py-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {step}
              </motion.div>
            ))}
          </AnimatePresence>
          {bookingSteps.length === 0 && (
            <p className="text-sm text-slate-500 italic">Initiating booking sequence...</p>
          )}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>Demo mode — no real bookings are being made.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-md overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Ready to book?</h3>
              <p className="text-sm text-slate-600 mb-4">
                All agents have agreed on your itinerary. Click below to confirm and the Executioner Agent will finalise your trip.
              </p>
              <Button
                onClick={handleBook}
                disabled={executeMutation.isPending}
                className="w-full h-11 text-base font-semibold shadow-sm"
              >
                {executeMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting...</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-2" /> Book This Trip</>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Demo mode — no real bookings or payments will be made
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
