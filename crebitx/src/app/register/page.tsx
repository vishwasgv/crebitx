"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { registerUser } from "@/app/actions/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, User, Mail, Phone, Briefcase, Lock, Eye, EyeOff } from "lucide-react"
import { signIn } from "next-auth/react"
import { CrebitXLogo } from "@/components/brand/crebitx-logo"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().min(1, "Work email is required").email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid 10-digit phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const highlights = [
  "Daily collections morning brief",
  "Green / yellow / red risk labels on every customer",
  "One-tap follow-ups and promise-to-pay tracking",
]

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
      return
    }

    if (!result.success || !result.tokens) {
      toast.error("Registration succeeded but sign-in could not be completed.")
      return
    }

    localStorage.setItem("access_token", result.tokens.accessToken)
    localStorage.setItem("refresh_token", result.tokens.refreshToken)

    const decodedToken = JSON.parse(atob(result.tokens.accessToken.split(".")[1]))
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: decodedToken.sub,
        email: decodedToken.email,
        firstName: decodedToken.firstName || "",
        lastName: decodedToken.lastName || "",
        tenantId: decodedToken.tenantId,
        role: decodedToken.role,
      }),
    )

    toast.success("Account created. Welcome to CrebitX.")

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (signInResult?.error) {
      toast.error("Account created. Please sign in with your new credentials.")
      router.push("/login")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#cae8eb]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#005259]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#6f797a] hover:text-[#005259] mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div className="hidden md:flex flex-col justify-center space-y-8 animate-fade-up-3d">
            <CrebitXLogo variant="wordmark" href="/" priority />
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-[#1d1b18] tracking-tight leading-tight">
                Start your free
                <br />
                14-day trial
              </h1>
              <p className="text-[#6f797a] font-medium leading-relaxed max-w-md">
                Built for hardware, ceramics, wholesale, and distribution teams who need
                clarity on who owes what — and what to do about it today.
              </p>
            </div>
            <ul className="space-y-4">
              {highlights.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-bold text-[#3f494a]">
                  <div className="w-5 h-5 rounded-full bg-[#005259]/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#005259]" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)] animate-fade-in-3d delay-100">
            <div className="md:hidden flex justify-center mb-6">
              <CrebitXLogo variant="wordmark" href="/" />
            </div>
            <div className="text-center md:text-left mb-8">
              <h2 className="text-2xl font-extrabold text-[#1d1b18]">Create your account</h2>
              <p className="text-sm text-[#6f797a] font-medium mt-2">
                No credit card required · Cancel anytime
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Full name
                </Label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ravi Sharma"
                    className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Business name
                </Label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <Input
                    id="businessName"
                    {...register("businessName")}
                    placeholder="Sharma Textiles"
                    className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
                  />
                </div>
                {errors.businessName && (
                  <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Work email
                </Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    placeholder="ravi@yourbusiness.com"
                    className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Phone
                </Label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register("phone")}
                    placeholder="+91 98765 43210"
                    className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Password
                </Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password")}
                    placeholder="At least 6 characters"
                    className="pl-11 pr-12 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f797a] hover:text-[#005259] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-ambient mt-4"
              >
                {loading ? "Creating account..." : <>Create account <ArrowRight size={18} /></>}
              </button>
            </form>

            <p className="text-center text-xs text-[#6f797a] mt-6 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-[#005259] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
