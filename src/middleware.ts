import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionSecret } from "@/lib/session-token";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
      if (payload.role === "admin" && payload.sub) return NextResponse.next();
    } catch {
      // Invalid or expired credentials are treated as unauthenticated.
    }
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
