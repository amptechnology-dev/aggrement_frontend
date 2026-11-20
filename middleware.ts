import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "login-token";
const PORTAL_ROLES: readonly string[] = ["SUPER_ADMIN", "OWNER"];
const SUPER_ADMIN_ONLY: readonly string[] = ["/dashboard/owners"];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = await getRole(token);
  const hasAccess = role !== null && PORTAL_ROLES.includes(role);

  if (pathname === "/login") {
    return hasAccess
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  if (!hasAccess) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    if (token) res.cookies.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  const superAdminOnly = SUPER_ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (superAdminOnly && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};