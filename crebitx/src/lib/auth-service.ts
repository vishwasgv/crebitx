const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  tenantId: string
  role: string
}

export const authService = {
  async register(data: RegisterData): Promise<{ user: UserData; tokens: AuthTokens }> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Registration failed" }))
      throw new Error(errorData.message || `Registration failed (${response.status})`)
    }

    const responseData = await response.json()
    if (!responseData.success || !responseData.data) {
      throw new Error("Invalid response from server")
    }

    const { accessToken, refreshToken } = responseData.data
    const decoded = JSON.parse(atob(accessToken.split(".")[1]))

    const user: UserData = {
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName || data.firstName,
      lastName: decoded.lastName || data.lastName,
      tenantId: decoded.tenantId,
      role: decoded.role,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken)
      localStorage.setItem("refresh_token", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))
    }

    return { user, tokens: { accessToken, refreshToken } }
  },

  async login(data: LoginData): Promise<{ user: UserData; tokens: AuthTokens }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Login failed" }))
      throw new Error(errorData.message || `Login failed (${response.status})`)
    }

    const responseData = await response.json()
    if (!responseData.success || !responseData.data) {
      throw new Error("Invalid response from server")
    }

    const { accessToken, refreshToken } = responseData.data
    if (!accessToken || !refreshToken) throw new Error("No tokens received")

    const decoded = JSON.parse(atob(accessToken.split(".")[1]))

    const user: UserData = {
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName || "",
      lastName: decoded.lastName || "",
      tenantId: decoded.tenantId,
      role: decoded.role,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken)
      localStorage.setItem("refresh_token", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))
    }

    return { user, tokens: { accessToken, refreshToken } }
  },

  async refreshToken(): Promise<string> {
    const refreshToken =
      typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null

    if (!refreshToken) throw new Error("No refresh token available")

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) throw new Error("Failed to refresh token")

    const responseData = await response.json()
    const { accessToken } = responseData.data

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken)
    }

    return accessToken
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
    }
  },

  isAuthenticated(): boolean {
    return typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false
  },

  getCurrentUser(): UserData | null {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user")
      try {
        return userStr ? JSON.parse(userStr) : null
      } catch {
        return null
      }
    }
    return null
  },

  getAccessToken(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  },

  getRefreshToken(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null
  },
}

export default authService
