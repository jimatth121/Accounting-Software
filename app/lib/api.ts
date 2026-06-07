import { toast } from "./toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AuthContext {
  userId: string;
  profile?: Record<string, string | undefined>;
}

export interface ApiOptions extends RequestInit {
  /** Success toast (skipped on GET and on read-only calls when omitted). */
  successMessage?: string;
  /** Detail line under the success toast. */
  successDetail?: string;
  /** Custom title for the error toast. Server message goes into the detail. */
  errorMessage?: string;
  /** Disable any auto toast for this call. */
  silent?: boolean;
}

let currentAuth: AuthContext | null = null;

export function setAuthContext(auth: AuthContext | null) {
  currentAuth = auth;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  if (typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.message === "string") return obj.message;
  }
  return fallback;
}

export async function api<T = unknown>(path: string, options?: ApiOptions): Promise<T> {
  const { successMessage, successDetail, errorMessage, silent, ...fetchInit } = options || {};
  const method = (fetchInit.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchInit.headers as Record<string, string>) || {})
  };

  if (currentAuth?.userId) {
    headers["x-user-id"] = currentAuth.userId;
    if (currentAuth.profile) {
      headers["x-user-profile"] = JSON.stringify(currentAuth.profile);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...fetchInit, headers });
  } catch (error) {
    if (!silent) {
      toast.error(
        errorMessage || "Network error",
        error instanceof Error ? error.message : "Could not reach the server."
      );
    }
    throw error;
  }

  if (!response.ok) {
    const body = await readBody(response);
    const detail = extractMessage(body, `Request failed with status ${response.status}`);
    if (!silent) {
      toast.error(errorMessage || "Something went wrong", detail);
    }
    throw new Error(detail);
  }

  const body = (await readBody(response)) as T;

  if (!silent && successMessage && method !== "GET") {
    toast.success(successMessage, successDetail);
  }

  return body as T;
}
