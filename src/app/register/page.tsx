"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { registerUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name is too short"),
})

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: z.infer<typeof registerSchema>) {
    setLoading(true)
    const result = await registerUser(data)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Account created! Verify your details.")
      router.push("/verify")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50/50 p-4">
      {/* Background logo watermark simulation */}
      <div className="fixed inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <img src="/logo.png" alt="watermark" className="w-[500px]" />
      </div>

      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-crebitx-teal">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Crebitx Logo" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-crebitx-teal">Create your account</CardTitle>
          <CardDescription>
            Join CrebitX today and take control of your cashflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="Your name" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" {...register("businessName")} placeholder="Your business name" />
              {errors.businessName && <p className="text-sm text-red-500">{errors.businessName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register("phone")} placeholder="10-digit phone number" />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} placeholder="At least 6 characters" />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-stone-500">
            Already have an account?{" "}
            <Link href="/login" className="text-crebitx-teal font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
