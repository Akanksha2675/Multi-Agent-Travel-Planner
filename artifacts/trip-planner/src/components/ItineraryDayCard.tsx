import { Activity, ItineraryDay } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, Clock, MapPin, Utensils, Compass, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  day: ItineraryDay;
  index: number;
}

const getActivityIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("food") || c.includes("dining") || c.includes("restaurant")) return <Utensils className="h-4 w-4" />;
  if (c.includes("sightseeing") || c.includes("tour")) return <Compass className="h-4 w-4" />;
  return <MapPin className="h-4 w-4" />;
};

function ActivityItem({ activity }: { activity: Activity }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200 last:hidden" />
      
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500">
        {getActivityIcon(activity.category)}
      </div>

      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h4 className="font-medium text-slate-900 text-sm">{activity.name}</h4>
            {activity.timeSlot && (
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> {activity.timeSlot} ({activity.duration})
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-slate-700">${activity.estimatedCost}</span>
        </div>
        
        {activity.description && (
          <p className="text-xs text-slate-600 mt-2 mb-2">{activity.description}</p>
        )}

        {activity.reasoning && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
              <Info className="h-3 w-3" /> Why this? <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-primary/5 p-2 rounded text-xs text-primary-foreground/80 text-slate-700 mt-2 italic border border-primary/10">
                "{activity.reasoning}"
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

export function ItineraryDayCard({ day, index }: Props) {
  let displayDate = "";
  try {
    displayDate = format(new Date(day.date), "EEEE, MMM d");
  } catch (e) {
    displayDate = day.date;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="mb-4 overflow-hidden border-slate-200">
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-baseline gap-2">
            <h3 className="font-bold text-slate-900 text-lg">Day {day.day}</h3>
            <span className="text-sm font-medium text-slate-500">{displayDate}</span>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            Daily total: ${day.dailyCost}
          </div>
        </div>
        <CardContent className="p-5">
          {day.notes && (
            <p className="text-sm text-slate-600 mb-6 italic border-l-2 border-primary/30 pl-3">{day.notes}</p>
          )}
          
          <div className="space-y-0">
            {day.activities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
            {day.activities.length === 0 && (
              <p className="text-sm text-slate-500 italic py-4 text-center">Activities are being planned...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
