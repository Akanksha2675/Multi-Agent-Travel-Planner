import { TransportOption, TransportModeOption } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plane, Train, Car, Info, ChevronDown, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  transport: TransportOption;
}

const ModeIcon = ({ mode, className }: { mode: string; className?: string }) => {
  if (mode === "flight") return <Plane className={className} />;
  if (mode === "train") return <Train className={className} />;
  return <Car className={className} />;
};

const modeLabel: Record<string, string> = {
  flight: "Flight",
  train: "Train",
  road: "Road / Drive",
};

const modeColors: Record<string, { bg: string; text: string; border: string }> = {
  flight: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-100" },
  train: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-100" },
  road: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-100" },
};

function OptionRow({ opt }: { opt: TransportModeOption }) {
  const colors = modeColors[opt.mode] ?? modeColors.flight;
  return (
    <div className={`flex items-center gap-2 text-xs p-1.5 rounded ${opt.price == null ? "opacity-50" : ""}`}>
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${colors.bg} ${colors.text}`}>
        <ModeIcon mode={opt.mode} className="h-3 w-3" />
        {modeLabel[opt.mode]}
      </span>
      <span className="text-slate-600">{opt.duration}</span>
      <span className="text-slate-400">·</span>
      <span className="font-medium text-slate-700">
        {opt.price != null ? `₹${opt.price.toLocaleString("en-IN")}` : "Not available"}
      </span>
      <span className="text-slate-500 flex-1 truncate">{opt.summary}</span>
    </div>
  );
}

export function TransportCard({ transport }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = modeColors[transport.mode] ?? modeColors.flight;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`mb-4 bg-gradient-to-br from-white to-slate-50/40 overflow-hidden shadow-sm border ${colors.border}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`${colors.bg} p-2 rounded-lg`}>
                <ModeIcon mode={transport.mode} className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{transport.provider}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {modeLabel[transport.mode]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                  <span className="font-medium text-slate-800 truncate max-w-[140px]">{transport.departure}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 truncate max-w-[140px]">{transport.arrival}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-lg text-slate-900">₹{transport.price.toLocaleString("en-IN")}</div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" /> {transport.duration}
              </div>
            </div>
          </div>

          {transport.comparison && (
            <div className={`text-xs ${colors.bg} ${colors.text} rounded-md px-3 py-2 mb-4 flex items-start gap-2`}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{transport.comparison}</span>
            </div>
          )}

          {transport.allOptions && transport.allOptions.length > 0 && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-slate-600 font-medium hover:text-slate-900 transition-colors mb-2">
                <Info className="h-4 w-4" /> All options compared
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-slate-50 rounded-md p-2 space-y-1 border border-slate-100">
                  {transport.allOptions.map((opt) => (
                    <OptionRow key={opt.mode} opt={opt} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {transport.reasoning && !transport.comparison && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-slate-600 font-medium hover:text-slate-900 transition-colors">
                <Info className="h-4 w-4" /> Agent reasoning
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 mt-2 border border-slate-100 italic">
                  "{transport.reasoning}"
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
