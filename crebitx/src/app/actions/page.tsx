import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { getDailyBrief, getNextBestActions } from "@/app/actions/operating-intelligence"
import { Sparkles, Phone, MessageSquare, Clock, ArrowRight, Zap, Target, Star, Filter } from "lucide-react"
import Link from "next/link"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"
import { RecommendedActionButtons } from "@/components/actions/recommended-action-buttons"
import { DailyBriefItemButton } from "@/components/actions/daily-brief-item-button"

export default async function ActionsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [data, brief, nextActions] = await Promise.all([
    getDashboardKPIs(),
    getDailyBrief(),
    getNextBestActions(5),
  ])
  if (!data) return null

  const user = session.user
  const actions = nextActions.length
    ? nextActions
    : (data.alerts || []).map((alert: any, i: number) => ({
        id: `fallback-${i}`,
        customerId: alert.customerId,
        customerName: alert.name,
        phone: alert.phone,
        title: `Follow up with ${alert.name}`,
        reason: `Overdue Rs. ${Number(alert.amount || 0).toLocaleString()}`,
        priority: i + 1,
      }))

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#005259] rounded-[3rem] p-10 md:p-14 text-white shadow-ambient relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                <Clock size={12} /> Morning Action Brief
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Focus on these <br />3 Priority Wins.
              </h2>
              <p className="text-white/70 font-medium text-lg max-w-md">
                {brief?.summary || "CREBITX is preparing today's priority recovery actions from live customer and ledger data."}
              </p>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#005259] shadow-lg">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Money At Risk</p>
                  <p className="text-xl font-black">Rs. {Number(brief?.moneyAtRisk || data.overdueAmount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <Sparkles size={300} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
          </div>
        </Scroll3D>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Scroll3D>
              <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-black tracking-tight">Priority Actions</h3>
                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#005259] hover:underline">
                  <Filter size={14} /> Filter Smart
                </button>
              </div>
            </Scroll3D>

            <div className="space-y-4">
              {actions.map((action: any, i: number) => (
                <Scroll3D key={action.id || i} delay={i * 100}>
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#005259]/30 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#f9f3ed] flex items-center justify-center text-[#005259] font-black text-xs shadow-inner">
                        #{action.priority || i + 1}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-extrabold text-[#1d1b18] group-hover:text-[#005259] transition-colors">{action.title}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#ba1a1a] uppercase tracking-widest">{action.actionType || "Urgent Follow-up"}</span>
                          <span className="w-1 h-1 rounded-full bg-[#bec8ca]" />
                          <span className="text-xs font-bold text-[#6f797a]">{action.reason}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={action.phone ? `tel:${action.phone}` : "#"} className="w-12 h-12 rounded-xl bg-[#cae8eb] text-[#005259] flex items-center justify-center hover:bg-[#005259] hover:text-white transition-all shadow-sm">
                        <Phone size={20} />
                      </a>
                      <Link href={action.customerId ? `/customers/${action.customerId}` : "/customers"} className="w-12 h-12 rounded-xl bg-[#f3ede8] text-[#3f494a] flex items-center justify-center hover:bg-[#005259] hover:text-white transition-all shadow-sm">
                        <MessageSquare size={20} />
                      </Link>
                      <RecommendedActionButtons actionId={action.id} />
                    </div>
                  </div>
                </Scroll3D>
              ))}

              {actions.length === 0 && (
                <div className="bg-white rounded-[2rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] text-sm font-bold text-[#6f797a]">
                  No priority actions yet. Add customers, sales, and due receivables to generate next-best actions.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <Scroll3D direction="right">
              <div className="bg-[#f9f3ed] rounded-[2.5rem] p-10 border border-[#005259]/10">
                <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Star size={20} className="text-[#005259]" /> Weekly Progress
                </h4>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[#6f797a]">
                      <span>Follow-up Rate</span>
                      <span className="text-[#005259]">92%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-[#005259] w-[92%] rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[#6f797a]">
                      <span>Recovery Conversion</span>
                      <span className="text-[#703d15]">64%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-[#703d15] w-[64%] rounded-full" />
                    </div>
                  </div>
                </div>
                <button className="mt-10 w-full py-4 bg-white border border-[#005259]/20 text-[#005259] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#005259] hover:text-white transition-all shadow-ambient-card">
                  Full Analytics Report
                </button>
              </div>
            </Scroll3D>

            <Scroll3D direction="right" delay={200}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient-card border border-[rgba(190,200,202,0.15)] relative overflow-hidden group">
                <div className="relative z-10">
                  <Zap size={32} className="text-[#005259] mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xl font-extrabold tracking-tight">Daily Brief Items</h4>
                  <div className="mt-5 space-y-3">
                    {(brief?.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#005259] p-4 text-white">
                        <div>
                          <p className="text-sm font-black">{item.title}</p>
                          <p className="text-xs font-medium text-white/70">{item.detail}</p>
                        </div>
                        <DailyBriefItemButton itemId={item.id} />
                      </div>
                    ))}
                    {!brief?.items?.length && (
                      <p className="text-sm font-medium text-[#6f797a] leading-relaxed">
                        Daily brief will appear here after the backend has customer and ledger records.
                      </p>
                    )}
                  </div>
                  <Link href="/weekly" className="mt-6 flex items-center gap-2 text-xs font-black text-[#005259] uppercase tracking-[0.2em] hover:translate-x-1 transition-transform">
                    Open Weekly Review <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Scroll3D>
          </div>
        </div>
      </main>
    </div>
  )
}
