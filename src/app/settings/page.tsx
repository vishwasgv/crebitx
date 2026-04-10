import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getSettings } from "@/app/actions/settings"
import { SettingsForm } from "@/components/settings/settings-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const settings = await getSettings()
  if (!settings) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} className="text-crebitx-teal" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-xl text-crebitx-teal tracking-tight">System Configuration</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Owner Control Panel</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Business Logic</h2>
            <p className="text-stone-500 font-medium max-w-xl">
              Configure your credit policies, reminder tones, and automated rules with precision.
            </p>
          </div>

          <SettingsForm initialSettings={settings} />
        </div>
      </main>
    </div>
  )
}
