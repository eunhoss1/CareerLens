export type AuthUser = {
  user_id: number;
  login_id: string;
  display_name: string;
  email: string;
  role?: string;
  admin?: boolean;
  profile_completed: boolean;
  account_status?: string;
  email_verified?: boolean;
  last_login_at?: string | null;
  access_token?: string;
  token_type?: string;
  expires_at?: number;
  country_dial_code?: string | null;
  phone_number?: string | null;
  marketing_opt_in?: boolean;
};

export type AvailabilityResponse = {
  field: "login_id" | "email";
  value: string;
  available: boolean;
  message: string;
};

const STORAGE_KEY = "careerlens_user";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function storeUser(user: AuthUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isAdminUser(user: AuthUser | null) {
  return Boolean(user?.admin) || user?.role === "ADMIN";
}

export function authHeaders(): Record<string, string> {
  const user = getStoredUser();
  if (!user?.access_token) {
    return {};
  }
  return {
    Authorization: `${user.token_type ?? "Bearer"} ${user.access_token}`
  };
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit | undefined, context: string): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(`${context} 서버에 연결할 수 없습니다. 백엔드 실행 상태와 네트워크를 확인해주세요.`);
  }
}

export async function signup(input: {
  login_id: string;
  display_name: string;
  email: string;
  country_dial_code?: string;
  phone_number?: string;
  password: string;
  password_confirm: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  security_notice_accepted: boolean;
  marketing_opt_in: boolean;
}): Promise<AuthUser> {
  return authRequest("/api/auth/signup", input);
}

export async function login(input: { login_id: string; password: string }): Promise<AuthUser> {
  return authRequest("/api/auth/login", input);
}

export async function checkLoginIdAvailability(loginId: string): Promise<AvailabilityResponse> {
  return availabilityRequest(`/api/auth/check-login-id?login_id=${encodeURIComponent(loginId)}`);
}

export async function checkEmailAvailability(email: string): Promise<AvailabilityResponse> {
  return availabilityRequest(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/auth/me`, {
    headers: authHeaders(),
    cache: "no-store"
  }, "현재 사용자 조회");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Current user request failed."));
  }

  return response.json();
}

export async function updateCurrentUser(input: {
  display_name: string;
  email: string;
  country_dial_code?: string;
  phone_number?: string;
  marketing_opt_in?: boolean;
}): Promise<AuthUser> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(input),
    cache: "no-store"
  }, "계정 정보 수정");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Account update request failed."));
  }

  const user = await response.json();
  storeUser(user);
  return user;
}

export async function changePassword(input: {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}): Promise<AuthUser> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}/api/auth/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(input),
    cache: "no-store"
  }, "비밀번호 변경");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Password change request failed."));
  }

  const user = await response.json();
  storeUser(user);
  return user;
}

async function authRequest(path: string, input: object): Promise<AuthUser> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input),
    cache: "no-store"
  }, "인증 요청");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Authentication request failed."));
  }

  return response.json();
}

async function availabilityRequest(path: string): Promise<AvailabilityResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await apiFetch(`${baseUrl}${path}`, {
    method: "GET",
    cache: "no-store"
  }, "중복 확인");

  if (!response.ok) {
    throw new Error(await readApiError(response, "Availability request failed."));
  }

  return response.json();
}

export async function readApiError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string };
    return parsed.message || parsed.error || fallback;
  } catch {
    return text;
  }
}
