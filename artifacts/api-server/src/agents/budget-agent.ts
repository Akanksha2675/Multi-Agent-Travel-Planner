import { TripRequest, FlightOption, HotelOption, ItineraryDay } from "./types.js";

export interface BudgetAllocation {
  flights: number;
  hotel: number;
  activities: number;
  miscellaneous: number;
}

export interface BudgetCheck {
  approved: boolean;
  reason?: string;
  adjustment?: string;
  overage?: number;
}

export function allocateBudget(request: TripRequest): BudgetAllocation {
  const { budget } = request;
  const nights = Math.round(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const misc = Math.floor(budget * 0.05);
  const flights = Math.floor(budget * 0.30);
  const hotel = Math.floor(budget * 0.35);
  const activities = budget - flights - hotel - misc;

  return { flights, hotel, activities, miscellaneous: misc };
}

export function checkFlightBudget(flight: FlightOption, allocation: BudgetAllocation): BudgetCheck {
  if (flight.price <= allocation.flights) {
    return { approved: true };
  }
  const overage = flight.price - allocation.flights;
  return {
    approved: false,
    reason: `Flight cost $${flight.price} exceeds flight budget of $${allocation.flights} by $${overage}`,
    adjustment: `Find a flight costing at most $${allocation.flights} total`,
    overage,
  };
}

export function checkHotelBudget(hotel: HotelOption, allocation: BudgetAllocation): BudgetCheck {
  if (hotel.totalPrice <= allocation.hotel) {
    return { approved: true };
  }
  const overage = hotel.totalPrice - allocation.hotel;
  const nights = Math.round(hotel.totalPrice / hotel.pricePerNight);
  const maxPerNight = Math.floor(allocation.hotel / nights);
  return {
    approved: false,
    reason: `Hotel total $${hotel.totalPrice} exceeds hotel budget of $${allocation.hotel} by $${overage}`,
    adjustment: `Find a hotel at max $${maxPerNight}/night (total max $${allocation.hotel})`,
    overage,
  };
}

export function checkActivitiesBudget(
  days: ItineraryDay[],
  allocation: BudgetAllocation
): BudgetCheck {
  const total = days.reduce((sum, d) => sum + d.dailyCost, 0);
  if (total <= allocation.activities) {
    return { approved: true };
  }
  const overage = total - allocation.activities;
  return {
    approved: false,
    reason: `Activities total $${total} exceeds activities budget of $${allocation.activities} by $${overage}`,
    adjustment: `Reduce activities to fit within $${allocation.activities} total`,
    overage,
  };
}

export function computeSpend(
  flightCost: number,
  hotelCost: number,
  activitiesCost: number,
  miscCost: number,
  totalBudget: number
) {
  const spent = flightCost + hotelCost + activitiesCost + miscCost;
  return {
    totalBudget,
    spent,
    remaining: totalBudget - spent,
    flights: flightCost,
    hotel: hotelCost,
    activities: activitiesCost,
    miscellaneous: miscCost,
  };
}
