import { callClaude, parseJSON } from "./anthropic-client.js";
import { ItineraryDay, TripRequest } from "./types.js";

const SYSTEM = `You are the Activities Agent for a trip planning system.
You create detailed, opinionated day-by-day itineraries grounded in local knowledge.
Avoid generic top-10 lists — give specific, neighborhood-level recommendations with local context.
Always respond with valid JSON matching the ItineraryDay[] schema.`;

export async function planActivities(
  request: TripRequest,
  activitiesBudget: number
): Promise<ItineraryDay[]> {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const days = nights;

  const dateList: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dateList.push(d.toISOString().split("T")[0]);
  }

  const dailyBudget = Math.floor(activitiesBudget / days / request.travelers);

  const prompt = `Plan a ${days}-day itinerary for ${request.destination}:
- Travelers: ${request.travelers}
- Total activities budget: $${activitiesBudget}
- Per person per day budget: ~$${dailyBudget}
- Preferences: ${request.preferences || "none"}
- Dates: ${dateList.join(", ")}

Return a JSON array of day objects. Each day must have 3-4 activities:
[
  {
    "day": 1,
    "date": "${dateList[0]}",
    "activities": [
      {
        "id": "act-1-1",
        "name": "specific activity name",
        "category": "Museum|Food|Nature|Culture|Shopping|Entertainment|Adventure",
        "estimatedCost": <per person cost as number>,
        "duration": "2 hours",
        "description": "specific, opinionated description with local context",
        "timeSlot": "Morning|Afternoon|Evening",
        "reasoning": "why this fits the trip and preferences"
      }
    ],
    "dailyCost": <total cost for all travelers that day>,
    "notes": "local tip or day summary"
  }
]

Be specific and opinionated. Use real place names, neighborhoods, and local tips. Keep costs realistic.`;

  const text = await callClaude(SYSTEM, prompt, 8192);
  const days_data = parseJSON<ItineraryDay[]>(text);

  return days_data.map((day, i) => ({
    ...day,
    day: i + 1,
    date: dateList[i] ?? day.date,
  }));
}
