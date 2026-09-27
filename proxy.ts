import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  accessTokenExpired,
  authCookieOptions,
  refreshSession,
} from "@/lib/auth-session";

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh || !accessTokenExpired(access)) {
    return NextResponse.next();
  }

  const session = await refreshSession(refresh).catch(() => null);

  if (!session?.access_token) {
    request.cookies.delete(ACCESS_COOKIE);
    request.cookies.delete(REFRESH_COOKIE);
    const response = NextResponse.next({ request });
    response.cookies.set(ACCESS_COOKIE, "", authCookieOptions(0));
    response.cookies.set(REFRESH_COOKIE, "", authCookieOptions(0));
    return response;
  }

  // Server Components read cookies from the request, so the new tokens must be
  // forwarded downstream as well as returned to the browser.
  request.cookies.set(ACCESS_COOKIE, session.access_token);
  request.cookies.set(REFRESH_COOKIE, session.refresh_token);
  const response = NextResponse.next({ request });
  response.cookies.set(
    ACCESS_COOKIE,
    session.access_token,
    authCookieOptions(session.expires_in ?? 60 * 60),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    session.refresh_token,
    authCookieOptions(REFRESH_COOKIE_MAX_AGE),
  );
  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/api/portal/:path*", "/api/stripe/:path*"],
};
