import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "login-token";
const SUPER_ADMIN_ONLY: readonly string[] = ["/dashboard/owners"];

const HOME: Record<string, string> = {
  SUPER_ADMIN: "/dashboard",
  OWNER: "/dashboard",
  TENANT: "/tenant",
};

const getRole = async (token?: string): Promise<string | null> => {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.TOKEN_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
};

const startsWithPath = (pathname: string, base: string): boolean =>
  pathname === base || pathname.startsWith(`${base}/`);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = await getRole(token);
  const home: string | undefined = role ? HOME[role] : undefined;

  if (pathname === "/login") {
    return home
      ? NextResponse.redirect(new URL(home, request.url))
      : NextResponse.next();
  }

  // login nei ba role chena jay na
  if (!role || !home) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    if (token) res.cookies.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  // Tenant shudhu /tenant, baki duijon shudhu /dashboard
  if (startsWithPath(pathname, "/tenant") && role !== "TENANT") {
    return NextResponse.redirect(new URL(home, request.url));
  }
  if (startsWithPath(pathname, "/dashboard") && role === "TENANT") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  const superAdminOnly = SUPER_ADMIN_ONLY.some((p) => startsWithPath(pathname, p));
  if (superAdminOnly && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/tenant/:path*"],
};