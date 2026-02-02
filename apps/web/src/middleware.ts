/**
 * NextAuth Middleware for Route Protection
 *
 * Protects routes requiring authentication:
 * - /room/* - Requires login
 * - /lobby/* - Requires login
 * - /dashboard/* - Requires login + streamer allowlist
 *
 * See: docs/ssot/decisions.md D-007
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes - no auth required
  const publicRoutes = [
    "/",
    "/login",
    "/auth/error",
    "/join", // Join page is public (will redirect to login if needed)
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/join/"),
  );

  // Check if path is for overlay (special case: accessible without auth for OBS)
  const isOverlayRoute = pathname.startsWith("/overlay/");

  // Allow public routes and overlay routes
  if (isPublicRoute || isOverlayRoute) {
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!session) {
    const signInUrl = new URL("/login", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Dashboard routes require streamer status
  if (pathname.startsWith("/dashboard")) {
    if (!session.user?.isStreamer) {
      // Not a streamer - redirect to home with error
      const errorUrl = new URL("/", req.nextUrl.origin);
      errorUrl.searchParams.set("error", "streamer_only");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     * - api/* (API routes handle auth internally, avoid redirect on 401)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};
