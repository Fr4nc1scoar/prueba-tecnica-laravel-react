import { redirect } from "react-router";

export const API_URL = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000/api";

const COOKIE_NAME = "auth_session_token";
const USER_COOKIE_NAME = "auth_user_data";

export function getCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }).filter(([key]) => Boolean(key))
  );
}

export function getTokenFromRequest(request: Request): string | null {
  return getCookies(request)[COOKIE_NAME] || null;
}

export function createAuthHeaders(token: string, user?: AuthUser): Headers {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  );
  if (user) {
    const rawUser = Buffer.from(JSON.stringify(user)).toString("base64");
    headers.append(
      "Set-Cookie",
      `${USER_COOKIE_NAME}=${encodeURIComponent(rawUser)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );
  }
  return headers;
}

export function createTokenCookieHeader(token: string, user?: AuthUser): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
  ];
  if (user) {
    const rawUser = Buffer.from(JSON.stringify(user)).toString("base64");
    parts.push(
      `${USER_COOKIE_NAME}=${encodeURIComponent(rawUser)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );
  }
  return parts.join(", ");
}

export function destroyTokenCookieHeaders(): Headers {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
  headers.append(
    "Set-Cookie",
    `${USER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
  return headers;
}

export function destroyTokenCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT, ${USER_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export async function getAuthUser(request: Request): Promise<{ token: string; user: AuthUser } | null> {
  const cookies = getCookies(request);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const rawUser = cookies[USER_COOKIE_NAME];
  if (rawUser) {
    try {
      const parsed = JSON.parse(Buffer.from(rawUser, "base64").toString("utf-8"));
      if (parsed?.id && parsed?.email) {
        return { token, user: parsed };
      }
    } catch {
      // Fallback
    }
  }

  try {
    const res = await fetch(`${API_URL}/auth/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return { token, user: data.user || data };
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<{ token: string; user: AuthUser }> {
  const auth = await getAuthUser(request);
  if (!auth) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`, {
      headers: destroyTokenCookieHeaders(),
    });
  }
  return auth;
}
