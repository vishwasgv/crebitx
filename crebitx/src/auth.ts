import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authService } from "@/lib/auth-service"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

// Access token has a 15-min TTL; refresh 1 min before expiry
const ACCESS_TOKEN_TTL_MS = 14 * 60 * 1000

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })

  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`)

  const data = await res.json()
  const newToken = data?.data?.accessToken
  if (!newToken) throw new Error("No access token in refresh response")
  return newToken
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "development_secret_only",
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials)

        if (!parsedCredentials.success) return null

        const { email, password } = parsedCredentials.data

        try {
          const { user, tokens } = await authService.login({ email, password })
          if (user && tokens) {
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`.trim(),
              tenantId: user.tenantId,
              role: user.role,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            }
          }
        } catch (error) {
          console.error("Auth: login error:", error)
        }

        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // First login — store tokens and set expiry
      if (user) {
        token.id = user.id as string
        token.tenantId = user.tenantId as string
        token.role = user.role as string
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpiry = Date.now() + ACCESS_TOKEN_TTL_MS
        token.error = undefined
        return token
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpiry ?? 0)) {
        return token
      }

      // Don't keep retrying if refresh already failed
      if (token.error === "RefreshTokenError") return token

      // Token expired — try refresh
      if (!token.refreshToken) {
        token.error = "RefreshTokenError"
        return token
      }

      try {
        const newAccessToken = await refreshAccessToken(token.refreshToken)
        token.accessToken = newAccessToken
        token.accessTokenExpiry = Date.now() + ACCESS_TOKEN_TTL_MS
        token.error = undefined
      } catch {
        token.error = "RefreshTokenError"
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = token.id
      session.user.tenantId = token.tenantId
      session.user.role = token.role
      session.user.accessToken = token.accessToken
      session.user.refreshToken = token.refreshToken
      session.error = token.error
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
