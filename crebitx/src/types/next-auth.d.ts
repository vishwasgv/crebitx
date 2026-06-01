import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      tenantId: string
      role: string
      accessToken?: string
      refreshToken?: string
    } & DefaultSession["user"]
    error?: string
  }

  interface User {
    id: string
    tenantId: string
    role: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenantId: string
    role: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpiry?: number
    error?: string
  }
}
