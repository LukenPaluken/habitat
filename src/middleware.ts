import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Primera barrera del panel del vendedor: sin cookie de sesión ni se renderiza.
// Es solo una comprobación optimista (no valida que la sesión siga vigente):
// la verdad la dicen los endpoints, que devuelven 401 y el panel redirige.

const PUBLIC_PAGES = new Set(["/vendedor/login", "/vendedor/registro"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PAGES.has(pathname)) return NextResponse.next();

  if (!getSessionCookie(request)) {
    const login = new URL("/vendedor/login", request.url);
    if (pathname !== "/vendedor") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/vendedor/:path*"],
};
