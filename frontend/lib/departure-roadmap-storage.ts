import type { DepartureRoadmapData } from "@/lib/roadmap-checklists";

const STORAGE_KEY = "careerlens_departure_roadmap_data";

export function getStoredDepartureRoadmapData(): DepartureRoadmapData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DepartureRoadmapData>;
    if (!parsed.country || typeof parsed.country !== "string") {
      return null;
    }
    return {
      country: parsed.country,
      companyName: stringOrUndefined(parsed.companyName),
      jobTitle: stringOrUndefined(parsed.jobTitle),
      startDate: stringOrUndefined(parsed.startDate),
      departureAirport: stringOrUndefined(parsed.departureAirport),
      arrivalAirport: stringOrUndefined(parsed.arrivalAirport),
      visaStatus: stringOrUndefined(parsed.visaStatus),
      housingStatus: stringOrUndefined(parsed.housingStatus),
      destinationCity: stringOrUndefined(parsed.destinationCity),
      recommendedArrivalDate: stringOrUndefined(parsed.recommendedArrivalDate),
      departureWindowStart: stringOrUndefined(parsed.departureWindowStart),
      departureWindowEnd: stringOrUndefined(parsed.departureWindowEnd)
    };
  } catch {
    return null;
  }
}

export function storeDepartureRoadmapData(data: DepartureRoadmapData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}
