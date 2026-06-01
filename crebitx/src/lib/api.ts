/**
 * Browser-only Axios client for client components.
 * Do NOT import this in server actions or server components — use server-api.ts instead.
 */
import axios, { AxiosError } from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refresh_token")

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          const { accessToken } = response.data.data
          localStorage.setItem("access_token", accessToken)
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return api(originalRequest)
        } catch {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/login"
        }
      } else {
        localStorage.removeItem("access_token")
        window.location.href = "/login"
      }
    }

    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred"
    return Promise.reject({ message: errorMessage, status: error.response?.status, data: error.response?.data })
  }
)

export default api
