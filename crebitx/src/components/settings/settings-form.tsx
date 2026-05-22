"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { updateSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, BellRing, Rocket, Save, RefreshCw } from "lucide-react"

const settingsSchema = z.object({
  defaultCycle: z.number().min(1),
  defaultGrace: z.number().min(0),
  reminderTone: z.enum(["FRIENDLY", "BALANCED", "STRICT"]),
  autoApproveLimit: z.number().min(0),
  riskWeightDelay: z.number().min(0).max(1),
  riskWeightLimit: z.number().min(0).max(1),
})

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toNumber = (value: unknown, fallback: number) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  const getSliderPoint = (value: number | readonly number[]) =>
    Array.isArray(value) ? (value[0] ?? 0) : value

  const {
    handleSubmit,
    setValue,
    watch,
  } = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCycle: toNumber(initialSettings.defaultCycle, 30),
      defaultGrace: toNumber(initialSettings.defaultGrace, 7),
      reminderTone: (initialSettings.reminderTone ?? "FRIENDLY") as any,
      autoApproveLimit: toNumber(initialSettings.autoApproveLimit, 0),
      riskWeightDelay: toNumber(initialSettings.riskWeightDelay, 0.6),
      riskWeightLimit: toNumber(initialSettings.riskWeightLimit, 0.4),
    },
  })

  const reminderTone = watch("reminderTone")
  const defaultGrace = watch("defaultGrace")
  const autoApproveLimit = watch("autoApproveLimit")
  const riskWeightDelay = watch("riskWeightDelay")
  const riskWeightLimit = watch("riskWeightLimit")

  async function onSubmit(data: z.infer<typeof settingsSchema>) {
    setLoading(true)
    const result = await updateSettings(data)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Settings updated successfully!")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-10">
      <div className="md:col-span-7 space-y-10">
        {/* Credit Policy */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#005259]" size={24} />
            <h3 className="text-xl font-bold text-[#1d1b18]">Credit Policy</h3>
          </div>
          <div className="bg-[#f9f3ed] rounded-[1.5rem] p-6 space-y-8 border border-[rgba(190,200,202,0.15)]">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-[#1d1b18]">Smart Credit Approval</Label>
                <p className="text-xs text-[#6f797a] font-medium">Automate low-risk credit limits</p>
              </div>
              <Switch 
                checked={autoApproveLimit > 0} 
                onCheckedChange={(checked) => setValue("autoApproveLimit", checked ? 10000 : 0)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold text-[#1d1b18]">Auto-approve Limit (INR)</Label>
                <span className="text-sm font-black text-[#005259]">₹{autoApproveLimit.toLocaleString()}</span>
              </div>
              <Input
                type="number"
                min={0}
                step={500}
                value={autoApproveLimit}
                onChange={(e) => setValue("autoApproveLimit", Number(e.target.value) || 0)}
                className="bg-white rounded-xl border-[rgba(190,200,202,0.3)] font-medium"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-[#1d1b18]">Default Grace Period</Label>
                  <p className="text-xs text-[#6f797a] font-medium">Buffer days before follow-ups start</p>
                </div>
                <span className="text-2xl font-extrabold text-[#005259]">{defaultGrace}d</span>
              </div>
              <Slider 
                value={[defaultGrace]} 
                min={0}
                max={30} 
                step={1}
                onValueChange={(v) => setValue("defaultGrace", getSliderPoint(v), { shouldDirty: true })}
                className="py-4"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#bec8ca] uppercase tracking-widest">
                <span>Strict (0)</span>
                <span>Flexible (30)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reminder Automation */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BellRing className="text-[#005259]" size={24} />
            <h3 className="text-xl font-bold text-[#1d1b18]">Reminder Automation</h3>
          </div>
          <div className="bg-[#f9f3ed] rounded-[1.5rem] p-6 space-y-8 border border-[rgba(190,200,202,0.15)]">
            <div className="space-y-4">
              <Label className="text-base font-bold text-[#1d1b18]">Reminder Tone</Label>
              <div className="flex flex-wrap gap-2">
                {["FRIENDLY", "BALANCED", "STRICT"].map((tone) => (
                  <Button
                    key={tone}
                    type="button"
                    variant={reminderTone === tone ? "default" : "outline"}
                    className={`rounded-full px-6 font-bold text-[10px] uppercase tracking-widest transition-all ${
                      reminderTone === tone 
                        ? "bg-[#005259] text-white hover:bg-[#0f6c74] border-none" 
                        : "bg-white text-[#6f797a] border-[rgba(190,200,202,0.5)] hover:border-[#005259]"
                    }`}
                    onClick={() => setValue("reminderTone", tone as any)}
                  >
                    {tone}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-bold text-[#1d1b18]">Default Payment Cycle</Label>
              <Select 
                onValueChange={(v) => setValue("defaultCycle", parseInt(v || "30"))}
                defaultValue={watch("defaultCycle").toString()}
              >
                <SelectTrigger className="w-full bg-white rounded-xl border-[rgba(190,200,202,0.3)] font-medium">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent className="bg-[#fef8f3] border-[rgba(190,200,202,0.2)] rounded-xl">
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="45">45 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-[#1d1b18]">Risk Weight: Payment Delay</Label>
                  <p className="text-xs text-[#6f797a] font-medium">How strongly delayed payments impact risk score</p>
                </div>
                <span className="text-lg font-extrabold text-[#005259]">{Math.round(riskWeightDelay * 100)}%</span>
              </div>
              <Slider
                value={[riskWeightDelay]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) =>
                  setValue("riskWeightDelay", Number(getSliderPoint(v).toFixed(2)), { shouldDirty: true })
                }
                className="py-2"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-[#1d1b18]">Risk Weight: Credit Utilization</Label>
                  <p className="text-xs text-[#6f797a] font-medium">How strongly credit limit usage affects risk score</p>
                </div>
                <span className="text-lg font-extrabold text-[#005259]">{Math.round(riskWeightLimit * 100)}%</span>
              </div>
              <Slider
                value={[riskWeightLimit]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) =>
                  setValue("riskWeightLimit", Number(getSliderPoint(v).toFixed(2)), { shouldDirty: true })
                }
                className="py-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-5">
        <div className="sticky top-28 space-y-6">
          <div className="bg-[#005259] text-white rounded-[2rem] shadow-ambient-lg p-8 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <Rocket size={20} className="text-[#a2eff8]" />
                <div>
                  <h4 className="text-lg font-bold">Live Preview</h4>
                  <p className="text-[#a2eff8]/60 text-xs font-medium">Automated WhatsApp Sequence</p>
                </div>
              </div>
              
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                <p className="text-sm font-medium leading-relaxed italic">
                  {reminderTone === "FRIENDLY" 
                    ? "Hi Ravi! Just a friendly nudge about your pending amount of ₹45,000. Let us know if you need any help with the payment."
                    : reminderTone === "BALANCED"
                    ? "Hello Ravi, your payment of ₹45,000 is now due. Please process it at your earliest convenience to maintain your credit limit."
                    : "URGENT: Your account has ₹45,000 overdue. Please settle this immediately to avoid service suspension and impact on your risk score."
                  }
                </p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a2eff8]/70">Tone: {reminderTone}</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#a2eff8] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-[#a2eff8]/40" />
                  <div className="w-2 h-2 rounded-full bg-[#a2eff8]/20" />
                </div>
              </div>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-[#0f6c74] rounded-full blur-3xl opacity-50" />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-14 bg-[#005259] hover:bg-[#0f6c74] text-white text-lg font-bold rounded-xl shadow-ambient active:scale-95 transition-all"
          >
            <Save className="mr-2" size={20} /> {loading ? "Updating..." : "Publish Rules"}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-[#6f797a] font-bold uppercase tracking-widest text-[10px] hover:text-[#1d1b18] hover:bg-transparent" 
            type="button" 
            onClick={() => router.refresh()}
          >
            <RefreshCw className="mr-2" size={14} /> Discard Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
