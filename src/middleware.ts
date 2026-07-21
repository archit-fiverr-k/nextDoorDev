import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // 1. Resolve tenant subdomain if present
  const baseDomain = "localhost:3000";
  const hasSubdomain = hostname.endsWith(baseDomain) && hostname !== baseDomain;
  let subdomain = "";
  if (hasSubdomain) {
    subdomain = hostname.replace(`.${baseDomain}`, "");
  }

  // 2. Perform Subdomain Rewrites
  if (subdomain) {
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL(`/book/${subdomain}`, req.url));
    }
  }

  // 3. Perform Authentication & Role Checking
  const isAuth = !!req.auth;
  const role = req.auth?.user?.role;
  const isFirstLogin = req.auth?.user?.isFirstLogin;

  // Protected Routes
  const isProtectedRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/pharmacy") ||
    url.pathname.startsWith("/patient") ||
    url.pathname.startsWith("/change-password");

  // If NOT a protected route, it is 100% public (Service pages, Pharmacy pages, Booking flow, Search)
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // If accessing a protected route without auth -> redirect to login
  if (!isAuth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Enforce first login password change for staff/admin
  if (isFirstLogin && url.pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  // Admin Dashboard Guard
  if (url.pathname.startsWith("/admin")) {
    if (role !== "super_admin" && role !== "platform_admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Pharmacy Provider Dashboard Guard
  if (url.pathname.startsWith("/pharmacy")) {
    if (
      role !== "pharmacy" &&
      role !== "staff" &&
      role !== "super_admin" &&
      role !== "platform_admin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Patient Dashboard Guard
  if (url.pathname.startsWith("/patient")) {
    if (role !== "patient") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|uploads|favicon.ico).*)"],
};
