export type SettlementStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export type SettlementChecklistItem = {
  item_id: number;
  user_id: number;
  country: string;
  category: string;
  checklist_title: string;
  description: string;
  status: SettlementStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SettlementGuidance = {
  overall_status: "ON_TRACK" | "NEEDS_ATTENTION" | "EARLY_STAGE" | string;
  completion_rate: number;
  summary: string;
  priority_actions: string[];
  country_summaries: Array<{
    country: string;
    completion_rate: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH" | string;
    next_actions: string[];
  }>;
  generation_mode: string;
  disclaimer: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchSettlementChecklists(userId: number): Promise<SettlementChecklistItem[]> {
  const response = await fetch(`${baseUrl}/api/settlement/users/${userId}/checklists`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Settlement checklist request failed.");
  }

  return response.json();
}

export async function updateSettlementChecklistStatus(itemId: number, status: SettlementStatus): Promise<SettlementChecklistItem> {
  const response = await fetch(`${baseUrl}/api/settlement/checklists/${itemId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status }),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Settlement checklist status update failed.");
  }

  return response.json();
}

export async function generateSettlementGuidance(userId: number): Promise<SettlementGuidance> {
  const response = await fetch(`${baseUrl}/api/settlement/users/${userId}/guidance`, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Settlement guidance request failed.");
  }

  return response.json();
}
