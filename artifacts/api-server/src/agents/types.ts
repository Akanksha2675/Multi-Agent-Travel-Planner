export type AgentStatusValue = "idle" | "working" | "approved" | "rejected" | "retrying" | "done";

export interface AgentStatus {
  agentId: string;
  name: string;
  status: AgentStatusValue;
  currentTask: string | null;
  lastMessage: string | null;
  updatedAt: string;
}

export interface TransportModeOption {
  mode: "flight" | "train" | "road";
  price: number | null;
  duration: string;
  summary: string;
}

export interface TransportOption {
  id: string;
  mode: "flight" | "train" | "road";
  provider: string;
  departure: string;
  arrival: string;
  price: number;
  duration: string;
  stops: number;
  comparison: string;
  allOptions: TransportModeOption[];
  reasoning: string | null;
}

export interface HotelOption {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  totalPrice: number;
  rating: number;
  amenities: string[];
  reasoning: string | null;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  duration: string;
  description: string | null;
  timeSlot: string | null;
  reasoning: string | null;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
  dailyCost: number;
  notes: string | null;
}

export interface BudgetBreakdown {
  totalBudget: number;
  spent: number;
  remaining: number;
  transport: number;
  hotel: number;
  activities: number;
  miscellaneous: number;
}

export interface TripRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  originCity?: string;
  preferences?: string;
}

export interface TripPlan {
  sessionId: string;
  status: "planning" | "completed" | "failed" | "booked";
  request: TripRequest;
  transport?: TransportOption;
  hotel?: HotelOption;
  days: ItineraryDay[];
  budget: BudgetBreakdown;
  agents: AgentStatus[];
  createdAt: string;
  completedAt: string | null;
  bookingStatus?: "idle" | "booking" | "booked";
}

export type SSEEventType =
  | { type: "agent_update"; agent: AgentStatus }
  | { type: "trip_update"; trip: Partial<TripPlan> }
  | { type: "negotiation"; message: string; fromAgent: string; toAgent: string }
  | { type: "complete"; trip: TripPlan }
  | { type: "booking_update"; step: string; done: boolean }
  | { type: "error"; message: string };

export interface SessionState {
  sessionId: string;
  status: "planning" | "completed" | "failed" | "booked";
  request: TripRequest;
  plan: Partial<TripPlan>;
  agents: Map<string, AgentStatus>;
  createdAt: string;
  completedAt: string | null;
  sseClients: Set<(event: SSEEventType) => void>;
}
