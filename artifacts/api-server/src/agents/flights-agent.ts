import { callClaude, parseJSON } from "./anthropic-client.js";
import { FlightOption, TripRequest } from "./types.js";

const SYSTEM = `You are the Flights Agent for a trip planning system. 
Given a trip request, you find the best flight option within the allocated budget.
Always respond with a valid JSON object matching the FlightOption schema.
If the budget is tight, find a reasonable economy option. Be specific with airline names and times.`;

export async function searchFlights(
  request: TripRequest,
  flightBudget: number
): Promise<FlightOption> {
  const nights = Math.round(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const origin = request.originCity || "Mumbai";
  const prompt = `Find the best flight for this trip:
- Origin: ${origin}, India
- Destination: ${request.destination}
- Travel dates: ${request.startDate} to ${request.endDate} (${nights} nights)
- Travelers: ${request.travelers}
- Flight budget: ₹${flightBudget} total for all travelers (currency: Indian Rupees INR)
- Preferences: ${request.preferences || "none"}

Return a JSON object with these exact fields:
{
  "id": "flight-1",
  "airline": "airline name",
  "departure": "departure city and time e.g. New York (JFK) 08:30",
  "arrival": "arrival city and time e.g. Tokyo (NRT) 14:20+1",
  "price": <total price for all travelers as number>,
  "duration": "e.g. 14h 30m",
  "stops": <number of stops>,
  "reasoning": "brief explanation of why this is the best choice"
}

Use realistic airline names and prices. Keep price within budget if possible.`;

  const text = await callClaude(SYSTEM, prompt);
  const flight = parseJSON<FlightOption>(text);
  return { ...flight, id: "flight-1" };
}
