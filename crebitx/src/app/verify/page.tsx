"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ShieldCheck, Phone, CheckCircle2 } from "lucide-react"
import { getVerificationStatus, sendPhoneOtp, confirmPhoneOtp } from "@/app/actions/auth"

type Status = { isPhoneVerified: boolean; isEmailVerified: boolean; phone: string | null; email: string }

export default function VerificationPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [codeSent, setCodeSent] = useState(false)
  const [maskedTarget, setMaskedTarget] = useState("")
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getVerificationStatus().then((data) => {
      if (!data) {
        router.push("/login")
        return
      }
      setStatus(data)
      setLoadingStatus(false)
    })
  }, [router])

  async function onSendCode() {
    setSending(true)
    const result = await sendPhoneOtp()
    setSending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setMaskedTarget(result.data?.target || "")
    if (result.data?.alreadyVerified) {
      toast.success("Your phone is already verified.")
      setStatus((prev) => (prev ? { ...prev, isPhoneVerified: true } : prev))
      return
    }
    setCodeSent(true)
    toast.success("Verification code sent.")
  }

  async function onConfirmCode(e: React.FormEvent) {
    e.preventDefault()
    setConfirming(true)
    const result = await confirmPhoneOtp(code)
    setConfirming(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Phone verified!")
    setStatus((prev) => (prev ? { ...prev, isPhoneVerified: true } : prev))
  }

  if (loadingStatus) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50/50" />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-crebitx-teal">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-crebitx-teal/10 flex items-center justify-center text-crebitx-teal">
              <ShieldCheck size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-crebitx-teal">Verify your phone</CardTitle>
          <CardDescription>
            Your email is confirmed. Add phone verification for account recovery and SMS alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.isPhoneVerified ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={40} className="text-crebitx-teal mx-auto" />
              <p className="font-bold">Your phone is verified.</p>
            </div>
          ) : !status?.phone ? (
            <p className="text-center text-sm text-stone-500 py-6">
              No phone number is on file for this account. Add one in Settings to verify it.
            </p>
          ) : !codeSent ? (
            <div className="space-y-6 text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                <Phone size={14} className="text-crebitx-teal" /> {status.phone}
              </div>
              <Button className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90" disabled={sending} onClick={onSendCode}>
                {sending ? "Sending..." : "Send verification code"}
              </Button>
            </div>
          ) : (
            <form onSubmit={onConfirmCode} className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone size={14} className="text-crebitx-teal" /> Code sent to {maskedTarget}
                </Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  className="text-center tracking-[1em] font-bold"
                  maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90" disabled={confirming}>
                {confirming ? "Verifying..." : "Verify & Activate"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {codeSent && !status?.isPhoneVerified && (
            <p className="text-xs text-stone-400 font-medium text-center">
              Didn&apos;t receive the code?{" "}
              <button className="text-crebitx-teal font-bold hover:underline" onClick={onSendCode}>
                Resend
              </button>
            </p>
          )}
          <button
            className="text-xs text-stone-400 font-medium hover:underline"
            onClick={() => router.push("/dashboard")}
          >
            Skip for now
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
