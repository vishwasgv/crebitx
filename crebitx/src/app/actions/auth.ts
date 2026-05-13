"use server"

import { z } from "zod"

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

    // Return tokens to be stored on client side
    if (data.success && data.data.accessToken) {
      return { 
        success: true, 
        tokens: {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken 
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Something went wrong during registration. Please check if the backend is running." }
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
