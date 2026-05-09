export type AuthUser = {
  user_id: number;
  login_id: string;
  display_name: string;
  email: string;
  role?: string;
  admin?: boolean;
  profile_completed: boolean;
  access_token?: string;
  token_type?: string;
  expires_at?: number;
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

export function authHeaders(): HeadersInit {
  const user = getStoredUser();
  if (!user?.access_token) {
    return {};
  }
  return {
    Authorization: `${user.token_type ?? "Bearer"} ${user.access_token}`
  };
}

export async function signup(input: {
  login_id: string;
  display_name: string;
  email: string;
  password: string;
  password_confirm: string;
  terms_accepted: boolean;
}): Promise<AuthUser> {
  return authRequest("/api/auth/signup", input);
}

export async function login(input: { login_id: string; password: string }): Promise<AuthUser> {
  return authRequest("/api/auth/login", input);
}

async function authRequest(path: string, input: object): Promise<AuthUser> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Authentication request failed."));
  }

  return response.json();
}

async function readApiError(response: Response, fallback: string) {
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
