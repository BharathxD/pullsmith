import { getSessionCookie } from "better-auth/cookies";

import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie)
    return NextResponse.redirect(new URL("/auth", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|trpc|health|assets|site.webmanifest|opengraph-image|twitter-image|icon|apple-icon).*)",
  ],
};
