"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ShieldCheck, Mail, Phone } from "lucide-react"

export default function VerificationPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    toast.success("Account verified successfully!")
    router.push("/dashboard")
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
          <CardTitle className="text-2xl font-bold text-crebitx-teal">Verify your account</CardTitle>
          <CardDescription>
            We've sent a code to your email and phone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onVerify} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail size={14} className="text-crebitx-teal" /> Email OTP
                </Label>
                <Input placeholder="6-digit code" className="text-center tracking-[1em] font-bold" maxLength={6} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone size={14} className="text-crebitx-teal" /> Phone OTP
                </Label>
                <Input placeholder="6-digit code" className="text-center tracking-[1em] font-bold" maxLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Activate"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-xs text-stone-400 font-medium text-center">
            Didn't receive the code? <button className="text-crebitx-teal font-bold hover:underline">Resend</button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
