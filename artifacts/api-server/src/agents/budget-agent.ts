import { TripRequest, TransportOption, HotelOption, ItineraryDay } from "./types.js";

export interface BudgetAllocation {
  transport: number;
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
  const misc = Math.floor(budget * 0.05);
  const transport = Math.floor(budget * 0.30);
  const hotel = Math.floor(budget * 0.35);
  const activities = budget - transport - hotel - misc;
  return { transport, hotel, activities, miscellaneous: misc };
}

export function checkTransportBudget(transport: TransportOption, allocation: BudgetAllocation): BudgetCheck {
  if (transport.price <= allocation.transport) {
    return { approved: true };
  }
  const overage = transport.price - allocation.transport;
  return {
    approved: false,
    reason: `Transport cost ₹${transport.price} exceeds transport budget of ₹${allocation.transport} by ₹${overage}`,
    adjustment: `Find a transport option costing at most ₹${allocation.transport} total`,
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
    reason: `Hotel total ₹${hotel.totalPrice} exceeds hotel budget of ₹${allocation.hotel} by ₹${overage}`,
    adjustment: `Find a hotel at max ₹${maxPerNight}/night (total max ₹${allocation.hotel})`,
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
    reason: `Activities total ₹${total} exceeds activities budget of ₹${allocation.activities} by ₹${overage}`,
    adjustment: `Reduce activities to fit within ₹${allocation.activities} total`,
    overage,
  };
}

export function computeSpend(
  transportCost: number,
  hotelCost: number,
  activitiesCost: number,
  miscCost: number,
  totalBudget: number
) {
  const spent = transportCost + hotelCost + activitiesCost + miscCost;
  return {
    totalBudget,
    spent,
    remaining: totalBudget - spent,
    transport: transportCost,
    hotel: hotelCost,
    activities: activitiesCost,
    miscellaneous: miscCost,
  };
}
