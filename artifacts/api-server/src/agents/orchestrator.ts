import { SessionState, TripPlan } from "./types.js";
import { broadcast, updateAgent } from "./session-store.js";
import { searchFlights } from "./flights-agent.js";
import { searchHotels } from "./hotels-agent.js";
import { planActivities } from "./activities-agent.js";
import {
  allocateBudget,
  checkFlightBudget,
  checkHotelBudget,
  checkActivitiesBudget,
  computeSpend,
} from "./budget-agent.js";
import { logger } from "../lib/logger.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runOrchestrator(session: SessionState): Promise<void> {
  const { request } = session;

  try {
    updateAgent(session, "orchestrator", {
      status: "working",
      currentTask: "Decomposing trip request and allocating budget",
      lastMessage: `Planning trip to ${request.destination} for ${request.travelers} traveler(s), budget ₹${request.budget}`,
    });

    await sleep(800);

    const allocation = allocateBudget(request);

    broadcast(session, {
      type: "negotiation",
      message: `Budget allocated: Flights ₹${allocation.flights} | Hotel ₹${allocation.hotel} | Activities ₹${allocation.activities} | Misc ₹${allocation.miscellaneous}`,
      fromAgent: "Orchestrator",
      toAgent: "All Agents",
    });

    updateAgent(session, "budget", {
      status: "working",
      currentTask: "Tracking budget allocation",
      lastMessage: `Total ₹${request.budget} | Flights ₹${allocation.flights} | Hotel ₹${allocation.hotel} | Activities ₹${allocation.activities}`,
    });

    await sleep(500);

    // --- FLIGHTS ---
    updateAgent(session, "flights", {
      status: "working",
      currentTask: `Searching flights to ${request.destination}`,
      lastMessage: "Querying flight options...",
    });

    let flight = await searchFlights(request, allocation.flights);

    let flightCheck = checkFlightBudget(flight, allocation);
    if (!flightCheck.approved) {
      updateAgent(session, "budget", {
        status: "rejected",
        currentTask: "Rejecting flight — over budget",
        lastMessage: flightCheck.reason ?? null,
      });
      broadcast(session, {
        type: "negotiation",
        message: `Rejected flight: ${flightCheck.reason}. Requesting cheaper alternative.`,
        fromAgent: "Budget Agent",
        toAgent: "Flights Agent",
      });

      updateAgent(session, "flights", {
        status: "retrying",
        currentTask: "Retrying with tighter budget constraint",
        lastMessage: flightCheck.adjustment ?? null,
      });

      await sleep(1200);
      flight = await searchFlights(
        { ...request, budget: allocation.flights * 0.9 },
        allocation.flights
      );
      flightCheck = checkFlightBudget(flight, allocation);
    }

    if (flightCheck.approved || (flightCheck.overage ?? 0) < allocation.flights * 0.1) {
      updateAgent(session, "flights", {
        status: "approved",
        currentTask: null,
        lastMessage: `Selected: ${flight.airline} — ₹${flight.price}`,
      });
      updateAgent(session, "budget", {
        status: "working",
        currentTask: "Flight approved, tracking spend",
        lastMessage: `Flight approved: ₹${flight.price} of ₹${allocation.flights} allocated`,
      });
    } else {
      updateAgent(session, "flights", {
        status: "done",
        currentTask: null,
        lastMessage: `Best found: ${flight.airline} — ₹${flight.price}`,
      });
    }

    session.plan.flight = flight;
    broadcast(session, { type: "trip_update", trip: { flight } });

    await sleep(600);

    // --- HOTELS ---
    updateAgent(session, "hotels", {
      status: "working",
      currentTask: `Searching hotels in ${request.destination}`,
      lastMessage: "Querying lodging options...",
    });

    let hotel = await searchHotels(request, allocation.hotel);
    let hotelCheck = checkHotelBudget(hotel, allocation);

    if (!hotelCheck.approved) {
      updateAgent(session, "budget", {
        status: "rejected",
        currentTask: "Rejecting hotel — over budget",
        lastMessage: hotelCheck.reason ?? null,
      });
      broadcast(session, {
        type: "negotiation",
        message: `Rejected hotel "${hotel.name}": ${hotelCheck.reason}. Requesting cheaper option.`,
        fromAgent: "Budget Agent",
        toAgent: "Hotels Agent",
      });

      updateAgent(session, "hotels", {
        status: "retrying",
        currentTask: "Searching for more affordable accommodation",
        lastMessage: hotelCheck.adjustment ?? null,
      });

      await sleep(1200);
      hotel = await searchHotels(request, allocation.hotel, hotelCheck.adjustment);
      hotelCheck = checkHotelBudget(hotel, allocation);
    }

    updateAgent(session, "hotels", {
      status: "approved",
      currentTask: null,
      lastMessage: `Selected: ${hotel.name} — ₹${hotel.pricePerNight}/night`,
    });
    updateAgent(session, "budget", {
      status: "working",
      currentTask: "Hotel approved, tracking spend",
      lastMessage: `Hotel approved: ₹${hotel.totalPrice} of ₹${allocation.hotel} allocated`,
    });

    session.plan.hotel = hotel;
    broadcast(session, { type: "trip_update", trip: { hotel } });

    await sleep(600);

    // --- ACTIVITIES ---
    updateAgent(session, "activities", {
      status: "working",
      currentTask: `Building day-by-day itinerary for ${request.destination}`,
      lastMessage: "Curating local experiences...",
    });

    let days = await planActivities(request, allocation.activities);
    let activitiesCheck = checkActivitiesBudget(days, allocation);

    if (!activitiesCheck.approved) {
      updateAgent(session, "budget", {
        status: "rejected",
        currentTask: "Rejecting activities — over budget",
        lastMessage: activitiesCheck.reason ?? null,
      });
      broadcast(session, {
        type: "negotiation",
        message: `Activities over budget by ₹${activitiesCheck.overage}. Scaling back.`,
        fromAgent: "Budget Agent",
        toAgent: "Activities Agent",
      });

      updateAgent(session, "activities", {
        status: "retrying",
        currentTask: "Adjusting itinerary to fit budget",
        lastMessage: activitiesCheck.adjustment ?? null,
      });

      await sleep(1000);
      days = await planActivities(
        { ...request, budget: allocation.activities * 0.9 },
        allocation.activities
      );
    }

    updateAgent(session, "activities", {
      status: "approved",
      currentTask: null,
      lastMessage: `Itinerary finalized: ${days.length} days planned`,
    });

    session.plan.days = days;
    broadcast(session, { type: "trip_update", trip: { days } });

    // --- FINAL BUDGET ---
    const activitiesTotal = days.reduce((s, d) => s + d.dailyCost, 0);
    const budgetBreakdown = computeSpend(
      flight.price,
      hotel.totalPrice,
      activitiesTotal,
      allocation.miscellaneous,
      request.budget
    );

    session.plan.budget = budgetBreakdown;

    updateAgent(session, "budget", {
      status: "done",
      currentTask: null,
      lastMessage: `Total spent: ₹${budgetBreakdown.spent} of ₹${budgetBreakdown.totalBudget} (${Math.round((budgetBreakdown.spent / budgetBreakdown.totalBudget) * 100)}% of budget)`,
    });

    broadcast(session, { type: "trip_update", trip: { budget: budgetBreakdown } });

    updateAgent(session, "orchestrator", {
      status: "done",
      currentTask: null,
      lastMessage: `Trip plan complete. Total cost: ₹${budgetBreakdown.spent}`,
    });

    // --- FINALIZE ---
    const completedAt = new Date().toISOString();
    session.status = "completed";
    session.completedAt = completedAt;

    const finalPlan: TripPlan = {
      sessionId: session.sessionId,
      status: "completed",
      request,
      flight,
      hotel,
      days,
      budget: budgetBreakdown,
      agents: Array.from(session.agents.values()),
      createdAt: session.createdAt,
      completedAt,
    };

    session.plan = finalPlan;

    broadcast(session, { type: "complete", trip: finalPlan });

  } catch (err) {
    logger.error({ err }, "Orchestrator failed");
    session.status = "failed";
    session.completedAt = new Date().toISOString();

    updateAgent(session, "orchestrator", {
      status: "rejected",
      currentTask: null,
      lastMessage: `Planning failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    });

    broadcast(session, {
      type: "error",
      message: err instanceof Error ? err.message : "Trip planning failed",
    });
  }
}
