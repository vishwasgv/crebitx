import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { Phone, MessageSquare, CheckCircle2, ArrowRight, Zap, Target, Star, Filter, Users } from "lucide-react"
import Link from "next/link"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"

export default async function ActionsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const data = await getDashboardKPIs()
  if (!data) return null

  const user = session.user

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Page header always visible */}
        <Scroll3D>
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1b18] leading-[1.1] tracking-tight">
              Action <br />Hub
            </h2>
            <p className="text-sm font-semibold text-[#6f797a]">Your daily priority call and follow-up list.</p>
          </div>
        </Scroll3D>

        {data.alerts.length === 0 ? (
          /* Empty state */
          <Scroll3D>
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white rounded-[2.5rem] border border-[rgba(190,200,202,0.2)] shadow-ambient-card">
              <div className="w-20 h-20 rounded-[1.5rem] bg-[#cae8eb]/50 flex items-center justify-center text-[#005259]">
                <Target size={36} />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl font-extrabold text-[#1d1b18]">No actions needed today</h3>
                <p className="text-sm font-medium text-[#6f797a] leading-relaxed">
                  Once you add customers with outstanding receivables, your daily priority action list will appear here.
                </p>
              </div>
              <Link href="/customers">
                <button className="h-12 px-8 rounded-2xl bg-[#005259] text-white font-black text-sm flex items-center gap-2 hover:bg-[#0f6c74] transition-all shadow-ambient active:scale-95">
                  <Users size={18} /> Go to Customers
                </button>
              </Link>
            </div>
          </Scroll3D>
        ) : (
          <>
        {/* Morning Brief Section */}
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#005259] rounded-[3rem] p-10 md:p-14 text-white shadow-ambient relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Focus on these <br />{data.alerts.length} Priority {data.alerts.length === 1 ? "Win" : "Wins"}.
              </h2>
              <p className="text-white/70 font-medium text-lg max-w-md">
                Today&apos;s top actions can recover ₹{(data.overdueAmount * 0.8).toLocaleString()} if completed by 5 PM.
              </p>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#005259] shadow-lg">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Today&apos;s Potential</p>
                  <p className="text-xl font-black">₹{(data.overdueAmount * 0.8).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <Sparkles size={300} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
          </div>
        </Scroll3D>

        {/* Action Engine Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Priority List */}
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
              {data.alerts.map((alert: any, i: number) => (
                <Scroll3D key={i} delay={i * 100}>
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#005259]/30 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#f9f3ed] flex items-center justify-center text-[#005259] font-black text-xs shadow-inner">
                        #{i + 1}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xl font-extrabold text-[#1d1b18] group-hover:text-[#005259] transition-colors">{alert.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#ba1a1a] uppercase tracking-widest">Urgent Follow-up</span>
                          <span className="w-1 h-1 rounded-full bg-[#bec8ca]" />
                          <span className="text-xs font-bold text-[#6f797a]">Overdue ₹{alert.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="w-12 h-12 rounded-xl bg-[#cae8eb] text-[#005259] flex items-center justify-center hover:bg-[#005259] hover:text-white transition-all shadow-sm">
                        <Phone size={20} />
                      </button>
                      <button className="w-12 h-12 rounded-xl bg-[#f3ede8] text-[#3f494a] flex items-center justify-center hover:bg-[#005259] hover:text-white transition-all shadow-sm">
                        <MessageSquare size={20} />
                      </button>
                      <button className="h-12 px-6 rounded-xl bg-white border border-[rgba(190,200,202,0.25)] text-[#005259] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#005259] hover:text-white transition-all shadow-ambient-card">
                        Resolve <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                </Scroll3D>
              ))}
            </div>
          </div>

          {/* Sidebar Metrics */}
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
                  <h4 className="text-xl font-extrabold tracking-tight">Smart Templates</h4>
                  <p className="text-sm font-medium text-[#6f797a] mt-2 leading-relaxed">
                    Personalized AI messages ready for your top 5 customers.
                  </p>
                  <button className="mt-6 flex items-center gap-2 text-xs font-black text-[#005259] uppercase tracking-[0.2em] hover:translate-x-1 transition-transform">
                    Edit Templates <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </Scroll3D>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  )
}
