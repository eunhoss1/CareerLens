export type ApplicationStatus = "INTERESTED" | "PREPARING_DOCUMENTS" | "APPLIED" | "INTERVIEW" | "CLOSED";

export type ApplicationRecord = {
  application_id: number;
  user_id: number;
  job_id: number;
  roadmap_id: number | null;
  company_name: string;
  country: string;
  job_title: string;
  job_family: string;
  salary_range: string;
  work_type: string;
  status: ApplicationStatus;
  next_action: string;
  required_documents: string[];
  application_deadline: string | null;
  days_until_deadline: number | null;
  deadline_status: "ONGOING" | "EXPIRED" | "URGENT" | "SOON" | "OPEN";
  readiness_score: number;
  roadmap_completion_rate: number;
  completed_task_count: number;
  total_task_count: number;
  verified_task_count: number;
  document_checklist: Array<{
    key: string;
    label: string;
    status: "TODO" | "DONE" | "VERIFIED" | string;
    helper_text: string;
  }>;
  created_at: string;
  updated_at: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function fetchUserApplications(userId: number): Promise<ApplicationRecord[]> {
  const response = await fetch(`${baseUrl}/api/applications/users/${userId}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Application records request failed.");
  }

  return response.json();
}

export async function createApplicationFromRoadmap(roadmapId: number): Promise<ApplicationRecord> {
  const response = await fetch(`${baseUrl}/api/applications/from-roadmap/${roadmapId}`, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Application record creation failed.");
  }

  return response.json();
}

export async function updateApplicationStatus(applicationId: number, status: ApplicationStatus): Promise<ApplicationRecord> {
  const response = await fetch(`${baseUrl}/api/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status }),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Application status update failed.");
  }

  return response.json();
}
