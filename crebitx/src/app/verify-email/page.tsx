"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyEmailToken, resendVerificationEmail } from "@/app/actions/auth"
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"checking" | "success" | "error">(() => (token ? "checking" : "error"))
  const [errorMessage, setErrorMessage] = useState(() =>
    token ? "" : "This verification link is missing its token."
  )
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (!token) return

    verifyEmailToken(token).then((result) => {
      if (result.success) {
        setStatus("success")
      } else {
        setStatus("error")
        setErrorMessage(result.error || "Invalid or expired verification link.")
      }
    })
  }, [token])

  async function onResend() {
    if (!email) return
    setResending(true)
    await resendVerificationEmail(email)
    setResending(false)
    setResent(true)
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-ambient border border-[rgba(190,200,202,0.2)] text-center space-y-6">
        {status === "checking" && (
          <>
            <Loader2 size={40} className="text-[#005259] mx-auto animate-spin" />
            <h1 className="text-xl font-extrabold text-[#1d1b18]">Confirming your email...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#cae8eb]/50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-[#005259]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#1d1b18]">Email verified</h1>
              <p className="text-sm text-[#6f797a] font-medium">Your account is active. You can log in now.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl transition-all active:scale-95"
            >
              Go to login <ArrowRight size={18} />
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#ffdad6]/60 flex items-center justify-center mx-auto">
              <XCircle size={32} className="text-[#ba1a1a]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#1d1b18]">Link didn&apos;t work</h1>
              <p className="text-sm text-[#6f797a] font-medium">{errorMessage}</p>
            </div>

            {resent ? (
              <p className="text-sm font-bold text-[#005259]">
                If that email has a pending account, a new link is on its way.
              </p>
            ) : (
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#6f797a] ml-1">
                  Resend the link
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 bg-[#f9f3ed] border-none rounded-xl px-4 font-medium focus:ring-2 focus:ring-[#005259]/20 focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  disabled={resending || !email}
                  onClick={onResend}
                  className="w-full h-12 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Send new link"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
