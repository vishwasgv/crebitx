"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { MessageSquare, Send, Sparkles } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface WhatsAppDialogProps {
  customerName: string
  amount: string
  phone: string
}

export function WhatsAppDialog({ customerName, amount, phone }: WhatsAppDialogProps) {
  const [tone, setTone] = useState("ease")
  const [customMessage, setCustomMessage] = useState("")

  const templates: Record<string, string> = {
    ease: `Hi ${customerName}, hope you're doing well! Just a gentle reminder about the pending amount of ${amount}. Whenever you get a chance, please process it. Thanks!`,
    medium: `Hello ${customerName}, this is a reminder regarding your outstanding balance of ${amount}. We would appreciate it if you could settle this at your earliest convenience. Regards.`,
    warm: `URGENT: Your account has ${amount} overdue. To avoid any impact on your credit limit, please clear the dues immediately. Contact us if already paid.`,
  }

  const getMessage = () => {
    if (tone === "custom") return customMessage
    return templates[tone]
  }

  const handleSend = () => {
    const message = encodeURIComponent(getMessage())
    const url = `https://wa.me/91${phone}?text=${message}`
    window.open(url, "_blank")
  }

  return (
    <Dialog>
      <DialogTrigger className="flex-1 h-14 bg-white hover:bg-[#f9f3ed] text-[#3f494a] font-bold rounded-2xl flex items-center justify-center gap-2 border border-[rgba(190,200,202,0.3)] transition-all shadow-ambient-card active:scale-95">
        <MessageSquare size={18} className="text-[#005259]" /> WhatsApp
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-[rgba(190,200,202,0.2)] bg-[#fef8f3] p-8">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#cae8eb] flex items-center justify-center">
              <Sparkles size={20} className="text-[#005259]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-[#1d1b18]">Smart Alert</DialogTitle>
              <DialogDescription className="text-[#6f797a] font-medium text-xs">
                AI-crafted reminder for {customerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-8">
          <RadioGroup defaultValue="ease" onValueChange={setTone} className="grid grid-cols-3 gap-3">
            {[
              { id: "ease", label: "Gentle", icon: "🌱" },
              { id: "medium", label: "Firm", icon: "⚖️" },
              { id: "warm", label: "Urgent", icon: "🔥" }
            ].map((t) => (
              <div key={t.id}>
                <RadioGroupItem value={t.id} id={t.id} className="peer sr-only" />
                <Label
                  htmlFor={t.id}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-transparent bg-white p-4 hover:bg-[#f9f3ed] peer-data-[state=checked]:border-[#005259] peer-data-[state=checked]:bg-[#cae8eb]/20 transition-all cursor-pointer shadow-ambient-card h-full"
                >
                  <span className="text-xl mb-1">{t.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#1d1b18]">{t.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[10px] font-black text-[#6f797a] uppercase tracking-[0.2em]">Message Draft</Label>
              {tone !== "custom" && (
                <button 
                  onClick={() => { setTone("custom"); setCustomMessage(templates[tone]) }}
                  className="text-[10px] font-black text-[#005259] uppercase hover:underline"
                >
                  Edit manually
                </button>
              )}
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[rgba(190,200,202,0.2)] shadow-inner">
              {tone === "custom" ? (
                <Textarea 
                  placeholder="Type your custom message..." 
                  value={customMessage} 
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="bg-transparent border-none p-0 focus-visible:ring-0 text-sm font-medium text-[#3f494a] min-h-[80px]"
                />
              ) : (
                <p className="text-sm font-medium text-[#3f494a] leading-relaxed italic">
                  &ldquo;{getMessage()}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <button 
            onClick={handleSend} 
            className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-ambient active:scale-95"
          >
            <Send size={18} /> Dispatch WhatsApp
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
