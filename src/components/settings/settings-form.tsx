"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { updateSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, BellRing, Rocket, Save } from "lucide-react"

const settingsSchema = z.object({
  defaultCycle: z.number().min(1),
  defaultGrace: z.number().min(0),
  reminderTone: z.enum(["FRIENDLY", "BALANCED", "STRICT"]),
  autoApproveLimit: z.number().min(0),
})

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCycle: initialSettings.defaultCycle,
      defaultGrace: initialSettings.defaultGrace,
      reminderTone: initialSettings.reminderTone as any,
      autoApproveLimit: initialSettings.autoApproveLimit,
    },
  })

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
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-7 space-y-8">
        {/* Credit Policy */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-crebitx-teal" size={24} />
            <h3 className="text-xl font-bold text-stone-800">Credit Policy</h3>
          </div>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Smart Credit Approval</Label>
                  <p className="text-xs text-stone-500 font-medium">Automate low-risk credit limits</p>
                </div>
                <Switch 
                  checked={watch("autoApproveLimit") > 0} 
                  onCheckedChange={(checked) => setValue("autoApproveLimit", checked ? 10000 : 0)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Default Grace Period</Label>
                    <p className="text-xs text-stone-500 font-medium">Buffer days before follow-ups start</p>
                  </div>
                  <span className="text-2xl font-extrabold text-crebitx-teal">{watch("defaultGrace")}d</span>
                </div>
                <Slider 
                  defaultValue={[watch("defaultGrace")]} 
                  max={30} 
                  step={1}
                  onValueChange={(v) => setValue("defaultGrace", v[0])}
                />
                <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <span>Strict (0)</span>
                  <span>Flexible (30)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reminder Automation */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BellRing className="text-crebitx-teal" size={24} />
            <h3 className="text-xl font-bold text-stone-800">Reminder Automation</h3>
          </div>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-base font-bold">Reminder Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {["FRIENDLY", "BALANCED", "STRICT"].map((tone) => (
                    <Button
                      key={tone}
                      type="button"
                      variant={watch("reminderTone") === tone ? "default" : "outline"}
                      className={`rounded-full px-6 font-bold text-[10px] uppercase tracking-widest ${
                        watch("reminderTone") === tone ? "bg-crebitx-teal hover:bg-crebitx-teal/90" : ""
                      }`}
                      onClick={() => setValue("reminderTone", tone as any)}
                    >
                      {tone}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-bold">Default Payment Cycle</Label>
                <Select 
                  onValueChange={(v) => setValue("defaultCycle", parseInt(v))}
                  defaultValue={watch("defaultCycle").toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="45">45 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="md:col-span-5">
        <div className="sticky top-28 space-y-6">
          <Card className="bg-crebitx-teal text-white border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Rocket size={20} className="text-crebitx-gold" /> Live Preview
              </CardTitle>
              <CardDescription className="text-white/60 text-xs font-medium">
                Automated WhatsApp Sequence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-sm font-medium leading-relaxed italic">
                  {watch("reminderTone") === "FRIENDLY" 
                    ? "Hi Ravi! Just a friendly nudge about your pending amount of ₹45,000. Let us know if you need any help with the payment."
                    : watch("reminderTone") === "BALANCED"
                    ? "Hello Ravi, your payment of ₹45,000 is now due. Please process it at your earliest convenience to maintain your credit limit."
                    : "URGENT: Your account has ₹45,000 overdue. Please settle this immediately to avoid service suspension and impact on your risk score."
                  }
                </p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tone: {watch("reminderTone")}</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-crebitx-gold animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-crebitx-gold/60" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full h-14 bg-crebitx-teal hover:bg-crebitx-teal/90 text-lg font-bold shadow-lg active:scale-95 transition-all">
            <Save className="mr-2" size={20} /> {loading ? "Updating..." : "Publish Rules"}
          </Button>
          <Button variant="ghost" className="w-full text-stone-400 font-bold uppercase tracking-widest text-[10px]" type="button" onClick={() => router.refresh()}>
            Discard Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
