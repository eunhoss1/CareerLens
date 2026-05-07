export type DeparturePlanRequest = {
  target_country: string;
  destination_city: string;
  origin_airport: string;
  destination_airport: string;
  start_date: string;
  arrival_buffer_days: number;
  visa_status: string;
  housing_status: string;
};

export type DeparturePlan = {
  target_country: string;
  destination_city: string;
  origin_airport: string;
  destination_airport: string;
  start_date: string;
  recommended_arrival_date: string;
  departure_window_start: string;
  departure_window_end: string;
  days_until_departure_window: number;
  urgency_status: "ON_TRACK" | "SOON" | "URGENT" | "OVERDUE" | string;
  summary: string;
  flight_search_note: string;
  flight_data_status: "NOT_CONFIGURED" | "NO_RESULTS_OR_FAILED" | "LIVE_DUFFEL" | "LIVE_AMADEUS" | string;
  flight_offers: Array<{
    provider: string;
    origin_code: string;
    destination_code: string;
    departure_at: string;
    arrival_at: string;
    carrier_name: string;
    carrier_code: string;
    flight_number: string;
    duration: string;
    currency: string;
    total_price: string;
    bookable_seats: number | null;
  }>;
  milestones: Array<{
    phase: string;
    title: string;
    description: string;
    due_date: string;
    status: "TODO" | "URGENT" | "DONE" | string;
  }>;
  flight_api_providers: Array<{
    provider: string;
    useCase: string;
    integrationStatus: string;
    note: string;
  }>;
  generation_mode: string;
  disclaimer: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function generateDeparturePlan(request: DeparturePlanRequest): Promise<DeparturePlan> {
  const response = await fetch(`${baseUrl}/api/departure/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Departure plan request failed.");
  }

  return response.json();
}
