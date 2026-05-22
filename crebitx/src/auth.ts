import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authService } from "@/lib/auth-service"

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
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
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
            console.error("Login auth error:", error)
            return null
          }
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
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.role = user.role
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
        session.user.role = token.role as string
        session.user.accessToken = token.accessToken as string
        session.user.refreshToken = token.refreshToken as string
      }
      return session
    },
  },
})

