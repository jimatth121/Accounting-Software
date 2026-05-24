const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AuthContext {
  userId: string;
  profile?: Record<string, string | undefined>;
}

let currentAuth: AuthContext | null = null;

export function setAuthContext(auth: AuthContext | null) {
  currentAuth = auth;
}

export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {})
  };

  if (currentAuth?.userId) {
    headers["x-user-id"] = currentAuth.userId;
    if (currentAuth.profile) {
      headers["x-user-profile"] = JSON.stringify(currentAuth.profile);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
