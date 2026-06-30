import { SessionState, TripPlan } from "./types.js";
import { broadcast, updateAgent } from "./session-store.js";
import { searchTransport } from "./transport-agent.js";
import { searchHotels } from "./hotels-agent.js";
import { planActivities } from "./activities-agent.js";
import {
  allocateBudget,
  checkTransportBudget,
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
      message: `Budget allocated: Transport ₹${allocation.transport} | Hotel ₹${allocation.hotel} | Activities ₹${allocation.activities} | Misc ₹${allocation.miscellaneous}`,
      fromAgent: "Orchestrator",
      toAgent: "All Agents",
    });

    updateAgent(session, "budget", {
      status: "working",
      currentTask: "Tracking budget allocation",
      lastMessage: `Total ₹${request.budget} | Transport ₹${allocation.transport} | Hotel ₹${allocation.hotel} | Activities ₹${allocation.activities}`,
    });

    await sleep(500);

    // --- TRANSPORT ---
    updateAgent(session, "transport", {
      status: "working",
      currentTask: `Comparing transport options to ${request.destination}`,
      lastMessage: "Analysing flights, trains & road options...",
    });

    let transport = await searchTransport(request, allocation.transport);

    let transportCheck = checkTransportBudget(transport, allocation);
    if (!transportCheck.approved) {
      updateAgent(session, "budget", {
        status: "rejected",
        currentTask: "Rejecting transport — over budget",
        lastMessage: transportCheck.reason ?? null,
      });
      broadcast(session, {
        type: "negotiation",
        message: `Rejected transport: ${transportCheck.reason}. Requesting cheaper alternative.`,
        fromAgent: "Budget Agent",
        toAgent: "Transport Agent",
      });

      updateAgent(session, "transport", {
        status: "retrying",
        currentTask: "Retrying with tighter budget constraint",
        lastMessage: transportCheck.adjustment ?? null,
      });

      await sleep(1200);
      transport = await searchTransport(
        { ...request, budget: allocation.transport * 0.9 },
        allocation.transport
      );
      transportCheck = checkTransportBudget(transport, allocation);
    }

    if (transportCheck.approved || (transportCheck.overage ?? 0) < allocation.transport * 0.1) {
      updateAgent(session, "transport", {
        status: "approved",
        currentTask: null,
        lastMessage: `Selected: ${transport.provider} (${transport.mode}) — ₹${transport.price}`,
      });
      updateAgent(session, "budget", {
        status: "working",
        currentTask: "Transport approved, tracking spend",
        lastMessage: `Transport approved: ₹${transport.price} of ₹${allocation.transport} allocated`,
      });
    } else {
      updateAgent(session, "transport", {
        status: "done",
        currentTask: null,
        lastMessage: `Best found: ${transport.provider} (${transport.mode}) — ₹${transport.price}`,
      });
    }

    session.plan.transport = transport;
    broadcast(session, { type: "trip_update", trip: { transport } });

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
      transport.price,
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

    // Executioner stays idle until user triggers booking
    updateAgent(session, "executioner", {
      status: "idle",
      currentTask: null,
      lastMessage: "Awaiting your confirmation to book...",
    });

    // --- FINALIZE ---
    const completedAt = new Date().toISOString();
    session.status = "completed";
    session.completedAt = completedAt;
    session.plan.bookingStatus = "idle";

    const finalPlan: TripPlan = {
      sessionId: session.sessionId,
      status: "completed",
      request,
      transport,
      hotel,
      days,
      budget: budgetBreakdown,
      agents: Array.from(session.agents.values()),
      createdAt: session.createdAt,
      completedAt,
      bookingStatus: "idle",
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

export async function runExecutioner(session: SessionState): Promise<void> {
  const plan = session.plan as TripPlan;

  session.plan.bookingStatus = "booking";
  broadcast(session, { type: "trip_update", trip: { bookingStatus: "booking" } });

  updateAgent(session, "executioner", {
    status: "working",
    currentTask: "Initiating booking sequence",
    lastMessage: "Starting simulated booking...",
  });

  const steps = [
    { step: "Reserving transport with " + (plan.transport?.provider ?? "carrier") + "...", delay: 1800 },
    { step: "Transport confirmed ✓", delay: 1200 },
    { step: "Booking room at " + (plan.hotel?.name ?? "hotel") + "...", delay: 2000 },
    { step: "Hotel reservation confirmed ✓", delay: 1200 },
    { step: "Locking in activity slots...", delay: 1600 },
    { step: "Activities confirmed ✓", delay: 1000 },
    { step: "Generating itinerary document...", delay: 1400 },
  ];

  for (const { step, delay } of steps) {
    await new Promise((r) => setTimeout(r, delay));
    updateAgent(session, "executioner", {
      status: "working",
      currentTask: step,
      lastMessage: step,
    });
    broadcast(session, { type: "booking_update", step, done: false });
  }

  await new Promise((r) => setTimeout(r, 1000));

  updateAgent(session, "executioner", {
    status: "done",
    currentTask: null,
    lastMessage: "Trip booked! (Demo mode — no real bookings made)",
  });

  session.plan.bookingStatus = "booked";
  session.status = "booked";

  broadcast(session, { type: "booking_update", step: "Trip booked!", done: true });
  broadcast(session, { type: "trip_update", trip: { bookingStatus: "booked", status: "booked" } });
}
