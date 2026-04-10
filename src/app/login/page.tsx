"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setLoading(true)
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)

    if (result?.error) {
      toast.error("Invalid email or password")
    } else {
      toast.success("Logged in successfully!")
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-crebitx-teal">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Crebitx Logo" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-crebitx-teal">Welcome Back</CardTitle>
          <CardDescription>
            Log in to manage your business cashflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Your password" />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-stone-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-crebitx-teal font-semibold hover:underline">
              Register now
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
