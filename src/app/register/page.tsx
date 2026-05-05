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
import { ArrowRight, User, Mail, Phone, Briefcase, Lock } from "lucide-react"

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

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: z.infer<typeof registerSchema>) {
    setLoading(true)
    const result = await registerUser(data)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Account created! Let's get started.")
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#cae8eb]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#005259]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden md:flex flex-col justify-center space-y-8 animate-fade-up-3d">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9_aUmEXYyPv-C6yncMYleX5ixjKiltnbaxdt76yIO967EFoeI6_j35wdU2M3E-GLrJhgVooSe4WQuMUFf8ABCeg46zTp9O2JAFhfzBYpbm9xsV3leygUG-zvb7kG8i840q6-HgBSZXaHdfyB73LKLbDbDdfaGADlJ082LhnTXjkMlJNELtUwp5UxasH8IM0UYcFhHxgdQ5eyAq4eJ-ZzibVxNDBJ1O90BT7wWAz5YZYyVc0WjJ8lwY4RgjtXm25t8gT6DvEjvjXY" 
            alt="CREBITX Logo" 
            className="h-12 w-auto object-contain mb-6"
          />
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-[#1d1b18] tracking-tight leading-tight">
              Start your free <br />14-day trial.
            </h1>
            <p className="text-[#6f797a] font-medium leading-relaxed">
              No credit card required. Experience the power of automated cashflow intelligence.
            </p>
          </div>
          
          <ul className="space-y-4">
            {[
              "Daily collection morning brief",
              "Smart customer risk scoring",
              "One-tap WhatsApp reminders"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#3f494a]">
                <div className="w-5 h-5 rounded-full bg-[#005259]/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#005259]" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)] animate-fade-in-3d delay-100">
          <div className="md:hidden text-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#1d1b18]">Create account</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">Full Name</Label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                <Input id="name" {...register("name")} placeholder="Ravi Sharma" className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all" />
              </div>
              {errors.name && <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.name.message}</p>}
            </div>

            {/* Business Name */}
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">Business Name</Label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                <Input id="businessName" {...register("businessName")} placeholder="Sharma Textiles" className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all" />
              </div>
              {errors.businessName && <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.businessName.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                <Input id="email" type="email" {...register("email")} placeholder="ravi@example.com" className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all" />
              </div>
              {errors.email && <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">Phone</Label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all" />
              </div>
              {errors.phone && <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                <Input id="password" type="password" {...register("password")} placeholder="••••••••" className="pl-11 h-12 bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all" />
              </div>
              {errors.password && <p className="text-[10px] text-[#ba1a1a] font-bold ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-ambient mt-4"
            >
              {loading ? "Creating account..." : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-[#6f797a] mt-6 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#005259] font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
