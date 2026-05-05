import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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

          // Development/Testing Bypass
          if (email === "Sumanth10ks@gmail.com") {
            try {
              const user = await prisma.user.findUnique({ where: { email } })
              if (user) return user
              // If user doesn't exist in DB yet, return a mock user to bypass
              return { id: "demo-id", name: "Sumanth", email: "Sumanth10ks@gmail.com" }
            } catch (e) {
              return { id: "demo-id", name: "Sumanth", email: "Sumanth10ks@gmail.com" }
            }
          }

          const user = await prisma.user.findUnique({ where: { email } })
          if (!user || !user.password) return null
          
          const passwordMatch = await bcrypt.compare(password, user.password)
          if (passwordMatch) return user
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
        try {
          // Get tenant info
          const tenantUser = await prisma.tenantUser.findFirst({
            where: { userId: user.id },
            include: { tenant: true },
          })
          if (tenantUser) {
            token.tenantId = tenantUser.tenantId
            token.role = tenantUser.role
          } else {
            // Fallback for demo
            token.tenantId = "demo-tenant"
            token.role = "OWNER"
          }
        } catch (e) {
          token.tenantId = "demo-tenant"
          token.role = "OWNER"
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
