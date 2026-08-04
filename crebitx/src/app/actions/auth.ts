"use server"

import { z } from "zod"
import { api } from "@/lib/api"
import { apiWithAuthRetry } from "@/lib/server-api"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  businessName: z.string().min(2),
})

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export async function registerUser(formData: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(formData)
  
  if (!parsed.success) {
    return { error: "Invalid inputs" }
  }

  const { name, email, phone, password, businessName } = parsed.data

  try {
    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || firstName

    // Format phone: ensure it starts with + for international format
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      // If it's an Indian number starting with 9, add +91
      if (formattedPhone.match(/^[6-9]\d{9}$/)) {
        formattedPhone = `+91${formattedPhone}`
      } else if (!formattedPhone.startsWith('0')) {
        // For other numbers, add + if missing
        formattedPhone = `+${formattedPhone}`
      }
    }

    // Call backend API
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        phone: formattedPhone,
        firstName,
        lastName,
        tenantName: businessName,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.message || "Registration failed" }
    }

    // Registration no longer signs the user in directly — the backend sends
    // a verification email and blocks login until it's confirmed.
    if (data.success && data.data?.requiresVerification) {
      return { success: true, requiresVerification: true, email: data.data.email as string }
    }

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Something went wrong during registration. Please check if the backend is running." }
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    const response = await fetch(`${API_URL}/auth/verify-email/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { error: data.message || "Failed to resend verification email" }
    }
    return { success: true }
  } catch (error) {
    console.error("Resend verification email error:", error)
    return { error: "Something went wrong. Please check if the backend is running." }
  }
}

export async function verifyEmailToken(token: string) {
  try {
    const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { error: data.message || "Invalid or expired verification link" }
    }
    return { success: true }
  } catch (error) {
    console.error("Verify email token error:", error)
    return { error: "Something went wrong. Please check if the backend is running." }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { error: data.message || "Failed to request password reset" }
    }
    return { success: true }
  } catch (error) {
    console.error("Request password reset error:", error)
    return { error: "Something went wrong. Please check if the backend is running." }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { error: data.message || "Failed to reset password" }
    }
    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "Something went wrong. Please check if the backend is running." }
  }
}

export async function loginUser(formData: { email: string; password: string }) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.message || "Login failed" }
    }

    if (data.success && data.data.accessToken) {
      return { 
        success: true, 
        tokens: {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken 
        }
      }
    }

    return { error: "Invalid response from server" }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "Something went wrong during login. Please check if the backend is running." }
  }
}

// --- Phone verification (SMS OTP), for the logged-in user ---

export async function getVerificationStatus() {
  try {
    const response = await apiWithAuthRetry((headers) => api.get("/auth/verify/status", { headers }))
    return response.data?.data ?? null
  } catch (error) {
    console.error("Get verification status error:", error)
    return null
  }
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const shaped = error as { data?: { message?: string }; message?: string } | undefined
  return shaped?.data?.message || shaped?.message || fallback
}

export async function sendPhoneOtp() {
  try {
    const response = await apiWithAuthRetry((headers) => api.post("/auth/verify/send", {}, { headers }))
    return { success: true, data: response.data?.data }
  } catch (error) {
    console.error("Send phone OTP error:", error)
    return { error: extractErrorMessage(error, "Failed to send verification code") }
  }
}

export async function confirmPhoneOtp(code: string) {
  try {
    const response = await apiWithAuthRetry((headers) => api.post("/auth/verify/confirm", { code }, { headers }))
    return { success: true, data: response.data?.data }
  } catch (error) {
    console.error("Confirm phone OTP error:", error)
    return { error: extractErrorMessage(error, "Incorrect or expired code") }
  }
}
