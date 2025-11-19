import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Enhanced logging for debugging
  console.log(`[Middleware] Processing: ${pathname}`);
  console.log(`[Middleware] Token present: ${!!token}`);

  // Handle missing token
  if (!token) {
    console.log("[Middleware] No token found - redirecting to login");
    // For new/incognito browsers, redirect to appropriate login page with return URL
    const loginPath = pathname.startsWith("/admin") ? "/admin-login" : "/login";
    const redirectUrl = new URL(loginPath, req.url);
    
    // Add the original URL as a query parameter for redirect after login
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);

    
    console.log(`[Middleware] Redirecting to ${loginPath} with return URL: ${pathname}`);
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const role = (payload as any).role;
    const userId = (payload as any).id;
    const exp = (payload as any).exp;

    console.log(`[Middleware] Token verified - Role: ${role}, User: ${userId}`);

    // Check token expiration (additional safety check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (exp && exp < currentTime) {
      console.log("[Middleware] Token expired based on JWT exp claim");
      // For expired tokens, go through logout to clear session properly
      return createRedirectResponse("/logout", req.url, "session-expired", "Your session has expired. Please log in again.");
    }

    // Enhanced role-based access control
    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN") {
        console.log(`[Middleware] Unauthorized ADMIN access attempt by ${role}`);
        return createRedirectResponse("/dashboard", req.url, "access-denied", "You don't have permission to access admin area.");
      }
    }

    if (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/admin")) {
      if (role !== "USER") {
        console.log(`[Middleware] Unauthorized USER access attempt by ${role}`);
        return createRedirectResponse("/admin/dashboard", req.url, "access-denied", "You don't have permission to access user dashboard.");
      }
    }

    // Add user info to request headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', userId);
    response.headers.set('x-user-role', role);
    
    console.log(`[Middleware] Access granted for ${role} to ${pathname}`);
    return response;

  } catch (err) {
    console.error("[Middleware] JWT verification failed:", err);
    
    // Determine error type for better user experience
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    let toastType = "session-expired";
    let message = "Your session has expired. Please log in again.";
    
    if (errorMessage.includes('expired')) {
      toastType = "session-expired";
      message = "Your session has expired. Please log in again.";
    } else if (errorMessage.includes('invalid')) {
      toastType = "invalid-session";
      message = "Invalid session detected. Please log in again.";
    }

    return createRedirectResponse("/logout", req.url, toastType, message);
  }
}

// Helper function to create consistent redirect responses
function createRedirectResponse(redirectPath: string, currentUrl: string, toastType: string, message: string) {
  const response = NextResponse.redirect(new URL(redirectPath, currentUrl));
  
  // Clear the invalid token
  response.cookies.delete("token");
  
  // Set toast notification
  response.cookies.set("toast", toastType, { 
    path: "/", 
    maxAge: 10, // 10 seconds to show the message
    httpOnly: false // Allow client-side access for toast
  });
  
  response.cookies.set("toast-message", message, { 
    path: "/", 
    maxAge: 10,
    httpOnly: false
  });
  
  return response;
}


export const config = {
  
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
