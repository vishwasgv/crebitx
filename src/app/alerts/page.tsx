import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, ArrowLeft, Bell, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { WhatsAppDialog } from "@/components/alerts/whatsapp-dialog"

export default async function AlertsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const data = await getDashboardKPIs()
  if (!data) return null

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} className="text-crebitx-teal" />
            </Button>
          </Link>
          <h1 className="font-bold text-xl text-crebitx-teal tracking-tight">Priority Alerts</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-12">
        <section className="space-y-4">
          <div className="inline-flex px-4 py-1.5 rounded-full bg-red-50 text-red-500 font-bold text-[10px] tracking-widest uppercase border border-red-100">
            Attention Required
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Critical <br/>Liquidity Events
          </h2>
          <p className="text-stone-500 max-w-md text-lg font-medium leading-relaxed">
            We&apos;ve identified {data.alerts.length} urgent matters requiring your immediate intervention.
          </p>
        </section>

        <div className="space-y-6">
          {data.alerts.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-white">
              <Bell className="mx-auto text-stone-200 mb-4" size={48} />
              <p className="text-stone-400 font-bold uppercase text-xs tracking-widest">No alerts today</p>
            </Card>
          ) : (
            data.alerts.map((alert, idx) => (
              <Card key={idx} className="bg-white border-none shadow-sm overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                      <AlertTriangle className="text-red-500" size={28} />
                    </div>
                    <div className="flex-grow space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Overdue Payment</span>
                        <h3 className="text-2xl font-bold text-stone-900">Follow up: {alert.name} (₹{alert.amount.toLocaleString()})</h3>
                      </div>
                      <p className="text-stone-500 font-medium leading-relaxed">
                        This customer is currently {alert.overdue}. This impacts your working capital.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-4">
                        <a href={`tel:${alert.phone}`} className="flex-1 sm:flex-none">
                          <Button className="w-full bg-crebitx-teal hover:bg-crebitx-teal/90 font-bold h-12 px-8 rounded-xl shadow-lg shadow-crebitx-teal/20">
                            <Phone size={18} className="mr-2" /> Call Now
                          </Button>
                        </a>
                        <WhatsAppDialog 
                          customerName={alert.name} 
                          amount={`₹${alert.amount.toLocaleString()}`} 
                          phone={alert.phone || ""} 
                        />
                        <Button variant="ghost" className="flex-1 sm:flex-none h-12 px-8 text-stone-400 font-bold">Dismiss</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
