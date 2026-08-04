"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "@/app/actions/auth"
import { toast } from "sonner"
import { ArrowRight, Lock } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!token) {
      toast.error("This reset link is missing its token.")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.")
      return
    }

    setLoading(true)
    const result = await resetPassword(token, password)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setDone(true)
    toast.success("Password updated. You can log in now.")
    setTimeout(() => router.push("/login"), 1500)
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1d1b18] tracking-tight">Reset password</h1>
          <p className="text-[#6f797a] font-medium mt-2">Choose a new password for your account.</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)]">
          {done ? (
            <p className="text-center text-sm font-bold text-[#005259]">Redirecting you to login...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  New password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 w-full bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 w-full bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              >
                {loading ? "Updating..." : <>Update password <ArrowRight size={18} /></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#6f797a] mt-8 font-medium">
          <Link href="/login" className="text-[#005259] font-bold hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
