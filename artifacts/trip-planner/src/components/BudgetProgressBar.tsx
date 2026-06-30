import { BudgetBreakdown } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  budget: BudgetBreakdown;
}

export function BudgetProgressBar({ budget }: Props) {
  if (!budget) return null;

  const { totalBudget, spent, remaining, flights, hotel, activities } = budget;
  
  // Guard against divide by zero
  const safeTotal = totalBudget > 0 ? totalBudget : 1;
  const percentageSpent = Math.min((spent / safeTotal) * 100, 100);
  const isOverBudget = spent > totalBudget;

  const flightsPct = (flights / safeTotal) * 100;
  const hotelPct = (hotel / safeTotal) * 100;
  const activitiesPct = (activities / safeTotal) * 100;

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="font-medium text-slate-900">Budget Status</h3>
            <div className="text-2xl font-bold mt-1">
              ${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
              <span className="text-base font-normal text-slate-500"> / ${totalBudget.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
              {isOverBudget ? 'Over Budget' : `${remaining.toLocaleString()} remaining`}
            </span>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex mt-4">
          {flights > 0 && <div className="h-full bg-blue-500" style={{ width: `${flightsPct}%` }} title={`Flights: $${flights}`} />}
          {hotel > 0 && <div className="h-full bg-indigo-500" style={{ width: `${hotelPct}%` }} title={`Hotel: $${hotel}`} />}
          {activities > 0 && <div className="h-full bg-teal-500" style={{ width: `${activitiesPct}%` }} title={`Activities: $${activities}`} />}
          {isOverBudget && <div className="h-full bg-red-500 flex-1" />}
        </div>
        
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Flights</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Hotel</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Activities</div>
        </div>
      </CardContent>
    </Card>
  );
}
