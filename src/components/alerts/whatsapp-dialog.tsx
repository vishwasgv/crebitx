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
import { MessageSquare, Send } from "lucide-react"
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
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 sm:flex-none h-12 px-8 rounded-xl border-stone-200 font-bold">
          <MessageSquare size={18} className="mr-2" /> WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send WhatsApp Alert</DialogTitle>
          <DialogDescription>
            Select a tone for your reminder to {customerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <RadioGroup defaultValue="ease" onValueChange={setTone} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="ease" id="ease" className="peer sr-only" />
              <Label
                htmlFor="ease"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-crebitx-teal [&:has([data-state=checked])]:border-crebitx-teal cursor-pointer"
              >
                <span className="text-sm font-bold">Ease</span>
                <span className="text-[10px] text-stone-400 mt-1">Gentle</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="medium" id="medium" className="peer sr-only" />
              <Label
                htmlFor="medium"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-crebitx-teal [&:has([data-state=checked])]:border-crebitx-teal cursor-pointer"
              >
                <span className="text-sm font-bold">Medium</span>
                <span className="text-[10px] text-stone-400 mt-1">Firm</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="warm" id="warm" className="peer sr-only" />
              <Label
                htmlFor="warm"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-crebitx-teal [&:has([data-state=checked])]:border-crebitx-teal cursor-pointer"
              >
                <span className="text-sm font-bold">Warm</span>
                <span className="text-[10px] text-stone-400 mt-1">Urgent</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Message Preview</Label>
            <div className="bg-stone-50 p-4 rounded-xl border italic text-sm text-stone-600 leading-relaxed">
              {tone === "custom" ? (
                <Textarea 
                  placeholder="Type your custom message..." 
                  value={customMessage} 
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="bg-white border-stone-200"
                />
              ) : (
                getMessage()
              )}
            </div>
            {tone !== "custom" && (
              <button 
                onClick={() => { setTone("custom"); setCustomMessage(templates[tone]) }}
                className="text-[10px] font-bold text-crebitx-teal uppercase hover:underline"
              >
                Edit Message
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSend} className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90 h-12 font-bold">
            <Send size={18} className="mr-2" /> Send to WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
