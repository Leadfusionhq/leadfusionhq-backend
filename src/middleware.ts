import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  if (!token) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("toast", "login-required", { path: "/", maxAge: 5 });
    return res;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const role = (payload as any).role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const res = NextResponse.redirect(new URL("/dashboard", req.url));
      res.cookies.set("toast", "unauthorized", { path: "/", maxAge: 5 });
      return res;
    }

    if (pathname.startsWith("/dashboard") && role !== "USER") {
      const res = NextResponse.redirect(new URL("/admin/dashboard", req.url));
      res.cookies.set("toast", "unauthorized", { path: "/", maxAge: 5 });
      return res;
    }

    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    res.cookies.set("toast", "login-required", { path: "/", maxAge: 5 });
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
