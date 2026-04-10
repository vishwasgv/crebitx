"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  businessName: z.string().min(2),
})

export async function registerUser(formData: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(formData)
  
  if (!parsed.success) {
    return { error: "Invalid inputs" }
  }

  const { name, email, phone, password, businessName } = parsed.data

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    })

    if (existingUser) {
      return { error: "User with this email or phone already exists" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
        },
      })

      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
        },
      })

      await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "OWNER",
        },
      })

      return { user, tenant }
    })

    return { success: true, user: result.user }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Something went wrong during registration" }
  }
}
