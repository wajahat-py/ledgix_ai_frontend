import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require a valid session
const PROTECTED = ["/dashboard", "/invoices", "/upload", "/email", "/profile"];

// Routes that should redirect to /dashboard when the user is already signed in
const PUBLIC_ONLY = ["/", "/login", "/register", "/features", "/pricing", "/demo"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verify JWT directly — avoids calling /api/auth/session from within the proxy
    // which would create a circular request loop and is not needed here.
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    const isPublicOnly = PUBLIC_ONLY.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

    // No valid token on a protected route → send to sign-in page
    if (isProtected && (!token || token.error)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated user on a public-only page → send to dashboard
    if (token && !token.error && isPublicOnly) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Protected app routes
        "/dashboard/:path*",
        "/invoices/:path*",
        "/upload/:path*",
        "/email/:path*",
        "/profile/:path*",
        // Public routes — checked so authenticated users are redirected away
        "/",
        "/login",
        "/register",
        "/features",
        "/pricing",
        "/demo",
    ],
};
