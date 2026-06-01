"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react"
import authService from "@/lib/auth-service"
import { signIn } from "next-auth/react"
import { CrebitXLogo } from "@/components/brand/crebitx-logo"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setLoading(true)

    try {
      const result = await authService.login({
        email: data.email,
        password: data.password,
      })

      if (!result.tokens.accessToken) {
        throw new Error("Sign-in failed. Please try again.")
      }

      toast.success(`Welcome back, ${result.user.firstName || result.user.email}!`)

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error("Could not start your session. Please try again.")
      }

      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard")
      router.refresh()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Invalid email or password"
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#cae8eb]/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#005259]/6 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f797a] hover:text-[#005259] mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="text-center mb-10 animate-fade-up-3d">
          <div className="flex justify-center mb-6">
            <CrebitXLogo variant="wordmark" href="/" priority />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1d1b18] tracking-tight">Welcome back</h1>
          <p className="text-[#6f797a] font-medium mt-2">Sign in to your collections dashboard</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)] animate-fade-in-3d delay-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-[#3f494a]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder="you@yourbusiness.com"
                className="h-14 bg-[#f9f3ed] border-none rounded-xl text-[#1d1b18] font-medium placeholder:text-[#bec8ca] focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
              />
              {errors.email && (
                <p className="text-xs text-[#ba1a1a] font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-[#3f494a]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  placeholder="Your password"
                  className="h-14 bg-[#f9f3ed] border-none rounded-xl text-[#1d1b18] font-medium placeholder:text-[#bec8ca] focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f797a] hover:text-[#005259] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#ba1a1a] font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-ambient mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign in <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6f797a] mt-8 font-medium">
          New to CrebitX?{" "}
          <Link href="/register" className="text-[#005259] font-bold hover:underline underline-offset-4">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#005259]/20 border-t-[#005259] rounded-full animate-spin" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
