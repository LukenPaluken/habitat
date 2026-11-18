import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// First barrier of the seller panel: without a session cookie it is not rendered.
// It is only an optimistic check (it does not validate the session is still valid):
// the endpoints have the final word: they return 401 and the panel redirects.

const PUBLIC_PAGES = new Set(["/seller/login", "/seller/register"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PAGES.has(pathname)) return NextResponse.next();

  if (!getSessionCookie(request)) {
    const login = new URL("/seller/login", request.url);
    if (pathname !== "/seller") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*"],
};
