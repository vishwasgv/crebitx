import { auth } from "@/auth"
import { NextResponse } from "next/server"

const publicPaths = new Set(["/", "/login", "/register", "/plans"])
const authPaths = new Set(["/login", "/register"])

const protectedPrefixes = [
  "/dashboard",
  "/customers",
  "/actions",
  "/alerts",
  "/cashflow",
  "/collections",
  "/weekly",
  "/settings",
]

const devOnlyPaths = [
  "/test-login",
  "/working-login",
  "/simple-test",
  "/network-test",
  "/api-test",
  "/dashboard-new",
  "/verify",
]

function isProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  // Treat expired/invalid token sessions as logged out to prevent redirect loops
  const hasTokenError = (session as any)?.error === "RefreshTokenError"
  const isLoggedIn = !!session?.user && !hasTokenError

  if (process.env.NODE_ENV === "production") {
    if (devOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
  }

  if (isLoggedIn && authPaths.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (!isLoggedIn && isProtected(pathname)) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!isLoggedIn && !publicPaths.has(pathname) && !pathname.startsWith("/api")) {
    if (devOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
