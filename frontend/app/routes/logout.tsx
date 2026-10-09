import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { API_URL, destroyTokenCookieHeader, getTokenFromRequest } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const token = getTokenFromRequest(request);

  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    } catch {
      // Ignorar error al revocar si la red falla
    }
  }

  return redirect("/login", {
    headers: {
      "Set-Cookie": destroyTokenCookieHeader(),
    },
  });
}

export function loader() {
  return redirect("/login");
}
