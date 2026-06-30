import { FlightOption } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plane, Info, ChevronDown, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  flight: FlightOption;
}

export function FlightCard({ flight }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 border-blue-100 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Plane className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{flight.airline}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <span className="font-medium text-slate-800">{flight.departure}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-medium text-slate-800">{flight.arrival}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-slate-900">${flight.price}</div>
              <div className="text-xs text-slate-500 font-medium">Round trip</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 bg-white/60 p-2 rounded border border-blue-50">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              {flight.duration}
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="font-medium">
              {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops && flight.stops > 1 ? 's' : ''}`}
            </div>
          </div>

          {flight.reasoning && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors">
                <Info className="h-4 w-4" /> Agent Reasoning <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900 mt-3 border border-blue-100 shadow-inner italic">
                  "{flight.reasoning}"
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
