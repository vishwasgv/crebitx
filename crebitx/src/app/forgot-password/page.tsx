"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/app/actions/auth"
import { toast } from "sonner"
import { ArrowRight, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await requestPasswordReset(email)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1d1b18] tracking-tight">Forgot password?</h1>
          <p className="text-[#6f797a] font-medium mt-2">We&apos;ll email you a link to reset it.</p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)]">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm font-bold text-[#1d1b18]">Check your inbox</p>
              <p className="text-sm text-[#6f797a] font-medium">
                If an account exists for <span className="font-bold">{email}</span>, a reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bec8ca]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-11 h-12 w-full bg-[#f9f3ed] border-none rounded-xl font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              >
                {loading ? "Sending..." : <>Send reset link <ArrowRight size={18} /></>}
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
