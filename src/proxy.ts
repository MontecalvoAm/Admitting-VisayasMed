import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/dashboard"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  
  const isAuthRoute = path.startsWith('/api/auth');
  const isProtectedApiRoute = path.startsWith('/api') && !isAuthRoute;

  let response = NextResponse.next();

  if (isProtectedRoute || isProtectedApiRoute) {
    const cookie = req.cookies.get("session")?.value;
    const session = await decrypt(cookie);

    if (!session?.userId) {
      if (isProtectedApiRoute) {
        response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else {
        response = NextResponse.redirect(new URL("/login", req.nextUrl));
      }
    }
  }

  if (path === "/login") {
    const cookie = req.cookies.get("session")?.value;
    const session = await decrypt(cookie);
    if (session?.userId) {
      response = NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (path.startsWith('/dashboard') || path === '/login') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
