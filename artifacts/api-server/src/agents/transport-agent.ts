import { callClaude, parseJSON } from "./anthropic-client.js";
import { TransportOption, TripRequest } from "./types.js";

const SYSTEM = `You are the Transport Agent for a trip planning system.
Given a trip request, you compare multiple transport modes (flight, train, road/driving)
and recommend the best option based on budget, distance, and traveler preferences.
Always respond with valid JSON.`;

export async function searchTransport(
  request: TripRequest,
  transportBudget: number
): Promise<TransportOption> {
  const origin = request.originCity || "Mumbai";
  const nights = Math.round(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const prompt = `Compare transport options for this trip:
- Origin: ${origin}, India
- Destination: ${request.destination}
- Dates: ${request.startDate} to ${request.endDate} (${nights} nights)
- Travelers: ${request.travelers}
- Transport budget: ₹${transportBudget} total for all travelers (currency: Indian Rupees INR)
- Preferences: ${request.preferences || "none"}

Analyze 3 realistic transport options: flight, train (if rail connection exists), and road (driving/car hire).
Consider distance, travel time, comfort, and cost for all ${request.travelers} travelers.
Choose the BEST option that fits the budget and preferences.

Return exactly this JSON (no markdown, no explanation):
{
  "id": "transport-1",
  "mode": "<flight|train|road>",
  "provider": "<airline / rail service / car hire name>",
  "departure": "<origin city (code if flight) time e.g. Mumbai (BOM) 2026-09-01 06:00>",
  "arrival": "<destination city (code if flight) time>",
  "price": <total price all travelers as integer>,
  "duration": "<e.g. 2h 20m>",
  "stops": <0 for nonstop/train/road, integer for layovers>,
  "comparison": "<1-2 sentence explanation of why this mode beats alternatives, include cost/time numbers>",
  "allOptions": [
    { "mode": "flight", "price": <integer or null if infeasible>, "duration": "<duration>", "summary": "<one-line description>" },
    { "mode": "train", "price": <integer or null if no rail>, "duration": "<duration>", "summary": "<one-line>" },
    { "mode": "road", "price": <integer>, "duration": "<duration>", "summary": "<one-line>" }
  ],
  "reasoning": "<brief explanation of why this specific service is best>"
}

Use realistic INR prices. Keep price within ₹${transportBudget} if at all possible.`;

  const text = await callClaude(SYSTEM, prompt);
  const transport = parseJSON<TransportOption>(text);
  return { ...transport, id: "transport-1" };
}
