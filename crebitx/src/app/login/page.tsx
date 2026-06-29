"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import authService from "@/lib/auth-service"
import { signIn } from "next-auth/react"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "owner@democorp.com",
      password: "Password123!",
    }
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setLoading(true)
    
    try {
      const result = await authService.login({
        email: data.email,
        password: data.password,
      })
      
      if (result.tokens.accessToken) {
        toast.success(`Welcome back, ${result.user.firstName || result.user.email}!`)
        
        // Establish NextAuth session cookie so Server Actions work
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        // Use setTimeout to ensure toast shows before redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      }
    } catch (error: any) {
      console.error('âŒ Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Invalid email or password";
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#cae8eb]/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#005259]/6 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-fade-up-3d">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9_aUmEXYyPv-C6yncMYleX5ixjKiltnbaxdt76yIO967EFoeI6_j35wdU2M3E-GLrJhgVooSe4WQuMUFf8ABCeg46zTp9O2JAFhfzBYpbm9xsV3leygUG-zvb7kG8i840q6-HgBSZXaHdfyB73LKLbDbDdfaGADlJ082LhnTXjkMlJNELtUwp5UxasH8IM0UYcFhHxgdQ5eyAq4eJ-ZzibVxNDBJ1O90BT7wWAz5YZYyVc0WjJ8lwY4RgjtXm25t8gT6DvEjvjXY" 
            alt="CREBITX Logo" 
            className="h-12 w-auto object-contain mx-auto mb-6"
          />
          <h1 className="text-3xl font-extrabold text-[#1d1b18] tracking-tight">Welcome back</h1>
          <p className="text-[#6f797a] font-medium mt-2">Log in to your CREBITX dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)] animate-fade-in-3d delay-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-[#3f494a]">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className="h-14 bg-[#f9f3ed] border-none rounded-xl text-[#1d1b18] font-medium placeholder:text-[#bec8ca] focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
              />
              {errors.email && <p className="text-xs text-[#ba1a1a] font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-[#3f494a]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Your password"
                  className="h-14 bg-[#f9f3ed] border-none rounded-xl text-[#1d1b18] font-medium placeholder:text-[#bec8ca] focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f797a] hover:text-[#005259] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#ba1a1a] font-medium">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-ambient mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                <>Log In <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#6f797a] mt-8 font-medium animate-fade-up-3d delay-300">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#005259] font-bold hover:underline underline-offset-4">
            Register now
          </Link>
        </p>
      </div>
    </div>
  )
}


