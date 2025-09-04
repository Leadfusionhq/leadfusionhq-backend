import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

interface MyJWTPayload extends JWTPayload {
  role?: "ADMIN" | "USER";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  if (!token) {
    // No token → login required
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "login-required");
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as MyJWTPayload;

    // ✅ Protect admin routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const url = new URL("/dashboard", req.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    // ✅ Protect user routes
    if (pathname.startsWith("/dashboard") && role !== "USER") {
      const url = new URL("/admin", req.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token → force login
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "login-required");
    const response = NextResponse.redirect(url);
    response.cookies.delete("token");
    return response;
  }
}

// Protect both dashboard and admin routes
export const config = {
  matcher: ["/dashboard/:path*",
     "/admin/:path*"],
};
