import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSettings } from "@/app/actions/settings"
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults"
import { SettingsForm } from "@/components/settings/settings-form"
import { Shield, BellRing, BrainCircuit, Sparkles } from "lucide-react"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const settings = (await getSettings()) ?? DEFAULT_SETTINGS

  const user = session.user

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <Scroll3D>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#005259]/8 border border-[#005259]/15 text-[#005259] text-xs font-bold uppercase tracking-widest">
              <BrainCircuit size={14} /> Intelligence Core
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">Business <br />Logic</h2>
            <p className="text-[#3f494a] font-medium max-w-xl text-lg leading-relaxed mt-4">
              Configure your credit policies, reminder tones, and automated rules with precision.
            </p>
          </div>
        </Scroll3D>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Credit Rules", desc: "Automated risk flagging", icon: Shield, color: "text-[#005259]" },
            { title: "Auto Reminders", desc: "WhatsApp & Email tone", icon: BellRing, color: "text-[#703d15]" },
            { title: "AI Strategy", desc: "Collection optimization", icon: Sparkles, color: "text-[#4e696c]" },
          ].map((card, i) => (
            <Scroll3D key={i} delay={i * 100}>
              <div className="bg-white p-8 rounded-[2rem] border border-[rgba(190,200,202,0.15)] shadow-ambient-card tilt-card flex flex-col gap-4 group hover:border-[#005259]/30 transition-all">
                <div className={`w-12 h-12 rounded-2xl bg-[#f9f3ed] flex items-center justify-center ${card.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <card.icon size={24} />
                </div>
                <div>
                  <h4 className="font-black text-[#1d1b18] tracking-tight">{card.title}</h4>
                  <p className="text-xs text-[#6f797a] font-medium mt-1">{card.desc}</p>
                </div>
              </div>
            </Scroll3D>
          ))}
        </div>

        <Scroll3D>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-[rgba(190,200,202,0.15)] shadow-ambient">
            <SettingsForm initialSettings={settings} />
          </div>
        </Scroll3D>
      </main>
    </div>
  )
}
