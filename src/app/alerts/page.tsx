import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { Bell, LayoutDashboard, Users, Sparkles, Settings, Phone, MessageSquare, ShieldAlert, History, Filter } from "lucide-react"
import Link from "next/link"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"
import { WhatsAppDialog } from "@/components/alerts/whatsapp-dialog"

export default async function AlertsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const data = await getDashboardKPIs()
  if (!data) return null

  const user = session.user

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-black uppercase tracking-widest">
                <ShieldAlert size={12} /> Attention Required
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
                Critical <br />Liquidity Events
              </h2>
              <p className="text-[#6f797a] font-medium text-lg max-w-xl">
                We've identified {data.alerts.length} urgent matters requiring your immediate intervention to maintain optimal cashflow health.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="h-12 px-6 rounded-xl bg-white border border-[rgba(190,200,202,0.2)] shadow-ambient-card font-bold text-sm flex items-center gap-2 hover:bg-[#f3ede8] transition-all">
                <History size={18} /> History
              </button>
              <button className="h-12 px-6 rounded-xl bg-white border border-[rgba(190,200,202,0.2)] shadow-ambient-card font-bold text-sm flex items-center gap-2 hover:bg-[#f3ede8] transition-all">
                <Filter size={18} /> Filter
              </button>
            </div>
          </div>
        </Scroll3D>

        {/* Alerts List */}
        <div className="space-y-6">
          {data.alerts.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-ambient-card border border-[rgba(190,200,202,0.15)]">
              <div className="w-20 h-20 bg-[#cae8eb]/40 rounded-full flex items-center justify-center mx-auto mb-6 text-[#005259]">
                <Bell size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#1d1b18]">Clear Skies</h3>
              <p className="text-[#6f797a] mt-2 font-medium">No urgent payment risks detected currently.</p>
            </div>
          ) : (
            data.alerts.map((alert, i) => (
              <Scroll3D key={i} delay={i * 100}>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] hover:border-[#005259]/20 transition-all group overflow-hidden relative">
                  {/* Accent Line */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-[#ba1a1a]/80" />
                  
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-[#ffdad6] flex items-center justify-center shrink-0 shadow-inner">
                        <ShieldAlert size={28} className="text-[#ba1a1a]" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-[#ba1a1a] uppercase tracking-[0.2em]">Overdue Payment</div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-[#1d1b18]">
                          Follow up: {alert.name} (<span className="text-[#005259]">₹{alert.amount.toLocaleString()}</span>)
                        </h3>
                        <p className="text-[#3f494a] font-medium leading-relaxed max-w-2xl">
                          This customer is currently <span className="font-bold">{alert.overdue}</span>. This impacts your working capital. Immediate action is recommended to avoid further delay.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[rgba(190,200,202,0.2)]">
                      <button className="flex-1 lg:flex-none h-14 px-8 bg-[#005259] hover:bg-[#0f6c74] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-ambient active:scale-95">
                        <Phone size={18} /> Call Now
                      </button>
                      <WhatsAppDialog customerName={alert.name} amount={`₹${alert.amount.toLocaleString()}`} phone={alert.phone} />
                      <button className="flex-1 lg:flex-none h-14 px-8 bg-white hover:bg-[#f9f3ed] text-[#3f494a] font-bold rounded-2xl flex items-center justify-center gap-2 border border-[rgba(190,200,202,0.3)] transition-all shadow-ambient-card active:scale-95">
                        Hold
                      </button>
                    </div>
                  </div>
                </div>
              </Scroll3D>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
