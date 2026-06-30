import { HotelOption } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, Info, ChevronDown, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  hotel: HotelOption;
}

export function HotelCard({ hotel }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="mb-6 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{hotel.name}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{hotel.location}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-slate-900">₹{(hotel.totalPrice || hotel.pricePerNight).toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 font-medium">₹{hotel.pricePerNight.toLocaleString('en-IN')} / night</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {hotel.rating}
            </div>
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="text-xs text-slate-500 truncate max-w-[250px]">
                {hotel.amenities.slice(0, 3).join(" • ")}
                {hotel.amenities.length > 3 && "..."}
              </div>
            )}
          </div>

          {hotel.reasoning && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                <Info className="h-4 w-4" /> Agent Reasoning <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-indigo-50 p-3 rounded-md text-sm text-indigo-900 mt-3 border border-indigo-100 shadow-inner italic">
                  "{hotel.reasoning}"
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
