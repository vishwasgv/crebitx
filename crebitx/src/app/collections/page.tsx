import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { TrendingUp, Award, BarChart3, PieChart, Users, Calendar, ArrowUpRight, Zap, Target, History } from "lucide-react"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"

export default async function CollectionsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const data = await getDashboardKPIs()
  if (!data) return null

  const user = session.user

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Performance Scoreboard */}
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cae8eb] text-[#005259] text-[10px] font-black uppercase tracking-widest">
                <BarChart3 size={12} /> Performance Metrics
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
                Recovery <br />Efficiency
              </h2>
            </div>
            <div className="flex bg-white rounded-2xl p-2 shadow-ambient-card border border-[rgba(190,200,202,0.15)]">
              {['7D', '30D', '90D', 'ALL'].map((period) => (
                <button key={period} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === '30D' ? 'bg-[#005259] text-white shadow-ambient' : 'text-[#6f797a] hover:bg-[#f3ede8]'}`}>
                  {period}
                </button>
              ))}
            </div>
          </div>
        </Scroll3D>

        {/* High-Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Recovery Rate", value: "84.2%", icon: Target, sub: "+2.4% vs last period", color: "text-[#005259]", bg: "bg-[#cae8eb]/30" },
            { label: "Avg. Days Sales Outstanding", value: "32 Days", icon: Calendar, sub: "Decreased by 4 days", color: "text-[#1d1b18]", bg: "bg-[#f3ede8]/60" },
            { label: "Collections Volume", value: "₹24.8L", icon: TrendingUp, sub: "Top month this year", color: "text-[#005259]", bg: "bg-[#cae8eb]/30" },
            { label: "Bad Debt Ratio", value: "1.2%", icon: Award, sub: "Well below industry avg", color: "text-[#005259]", bg: "bg-[#cae8eb]/30" },
          ].map((stat, i) => (
            <Scroll3D key={i} delay={i * 80}>
              <div className="bg-white rounded-[2rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] h-full group hover:border-[#005259]/30 transition-all">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} mb-6 shadow-sm`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">{stat.label}</p>
                <h3 className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</h3>
                <p className="text-[11px] font-bold text-[#6f797a] mt-4 flex items-center gap-1">
                  <ArrowUpRight size={14} className="text-[#005259]" /> {stat.sub}
                </p>
              </div>
            </Scroll3D>
          ))}
        </div>

        {/* Main Analytics Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Scroll3D>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient-card border border-[rgba(190,200,202,0.15)]">
                <div className="flex justify-between items-center mb-10">
                  <h4 className="text-xl font-black tracking-tight">Recovery Trend</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#005259]" /><span className="text-[10px] font-bold text-[#6f797a] uppercase tracking-widest">Actual</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#cae8eb]" /><span className="text-[10px] font-bold text-[#6f797a] uppercase tracking-widest">Target</span></div>
                  </div>
                </div>
                <div className="h-72 flex items-end gap-4 relative px-2">
                  {[20, 35, 25, 45, 60, 55, 80, 75, 95, 90, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-xl transition-all duration-1000 animate-grow-height group relative" style={{ height: `${h}%`, backgroundColor: i === 11 ? "#005259" : "#f3ede8" }}>
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#005259] text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-ambient z-10">
                        ₹{(h * 25000).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-6 text-[10px] font-black text-[#6f797a] uppercase tracking-[0.2em] px-2"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span></div>
              </div>
            </Scroll3D>

            <Scroll3D delay={200}>
              <div className="bg-[#f9f3ed] rounded-[2.5rem] p-10 border border-[#005259]/10">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-xl font-black tracking-tight">Recovery Wins Feed</h4>
                  <History size={20} className="text-[#005259]" />
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Acme Corp Industries", amount: "₹1,80,000", time: "2h ago", icon: Zap },
                    { name: "Surat Textile Hub", amount: "₹45,000", time: "5h ago", icon: Target },
                    { name: "Global Tech Solutions", amount: "₹2,45,000", time: "Yesterday", icon: Award },
                  ].map((win, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-[#005259]/5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#cae8eb] flex items-center justify-center text-[#005259]"><win.icon size={20} /></div>
                        <div>
                          <p className="text-sm font-bold text-[#1d1b18]">{win.name}</p>
                          <p className="text-[10px] font-bold text-[#6f797a] uppercase tracking-widest">{win.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#005259]">{win.amount}</p>
                        <p className="text-[10px] font-bold text-[#005259] uppercase tracking-widest">Recovered</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Scroll3D>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <Scroll3D direction="right">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient-card border border-[rgba(190,200,202,0.15)] flex flex-col h-full overflow-hidden relative">
                <h4 className="text-xl font-black mb-8 tracking-tight">Status Distribution</h4>
                <div className="relative w-48 h-48 mx-auto mb-10">
                  <div className="absolute inset-0 rounded-full border-[16px] border-[#f3ede8]" />
                  <div className="absolute inset-0 rounded-full border-[16px] border-[#005259] border-t-transparent border-l-transparent" style={{ transform: 'rotate(45deg)' }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-[#1d1b18]">72%</span>
                    <span className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">Healthy</span>
                  </div>
                </div>
                <div className="space-y-4">
                   {[
                    { label: "Healthy (Green)", pct: "72%", color: "bg-[#005259]" },
                    { label: "Warning (Yellow)", pct: "18%", color: "bg-[#703d15]" },
                    { label: "Critical (Red)", pct: "10%", color: "bg-[#ba1a1a]" },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${item.color}`} /><span className="text-xs font-bold text-[#3f494a]">{item.label}</span></div>
                       <span className="text-xs font-black text-[#1d1b18]">{item.pct}</span>
                     </div>
                   ))}
                </div>
              </div>
            </Scroll3D>

            <Scroll3D direction="right" delay={200}>
               <div className="bg-[#005259] rounded-[2.5rem] p-10 text-white shadow-ambient relative overflow-hidden group">
                 <div className="relative z-10">
                    <PieChart size={32} className="mb-6 opacity-80 group-hover:rotate-12 transition-transform duration-500" />
                    <h4 className="text-xl font-black tracking-tight">Rule Optimization</h4>
                    <p className="text-sm font-medium text-white/70 mt-3 leading-relaxed">
                      Your current grace period rules are capturing <span className="text-white font-bold">₹4.2L</span> more than last month.
                    </p>
                    <button className="mt-8 px-6 py-3 bg-white text-[#005259] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#f9f3ed] transition-all">
                      Review Rules
                    </button>
                 </div>
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
               </div>
            </Scroll3D>
          </div>
        </div>
      </main>
    </div>
  )
}
