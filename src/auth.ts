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
        // Get tenant info
        const tenantUser = await prisma.tenantUser.findFirst({
          where: { userId: user.id },
          include: { tenant: true },
        })
        if (tenantUser) {
          token.tenantId = tenantUser.tenantId
          token.role = tenantUser.role
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
