import { callClaude, parseJSON } from "./anthropic-client.js";
import { HotelOption, TripRequest } from "./types.js";

const SYSTEM = `You are the Hotels Agent for a trip planning system.
Given a trip request and hotel budget, you find the best lodging option.
Always respond with a valid JSON object matching the HotelOption schema.
Be specific with real neighborhood names and hotel amenities.`;

export async function searchHotels(
  request: TripRequest,
  hotelBudget: number,
  retryNote?: string
): Promise<HotelOption> {
  const nights = Math.round(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const prompt = `Find the best hotel for this trip:
- Destination: ${request.destination}
- Dates: ${request.startDate} to ${request.endDate} (${nights} nights)
- Travelers: ${request.travelers}
- Total hotel budget: $${hotelBudget}
- Max per night: $${Math.floor(hotelBudget / nights)}
- Preferences: ${request.preferences || "none"}
${retryNote ? `- CONSTRAINT: ${retryNote}` : ""}

Return a JSON object with these exact fields:
{
  "id": "hotel-1",
  "name": "hotel name",
  "location": "neighborhood, city",
  "pricePerNight": <number>,
  "totalPrice": <pricePerNight * ${nights}>,
  "rating": <number 3.0-5.0>,
  "amenities": ["amenity1", "amenity2", "amenity3"],
  "reasoning": "brief explanation of why this hotel is the best choice"
}

Use realistic hotel names and prices. MUST keep total price within $${hotelBudget}.`;

  const text = await callClaude(SYSTEM, prompt);
  const hotel = parseJSON<HotelOption>(text);
  return { ...hotel, id: "hotel-1" };
}
