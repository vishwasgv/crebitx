import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { TrendingUp, AlertCircle, Wallet, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"

const calendarDays = [
  { day: "Mon", date: 22 }, { day: "Tue", date: 23, active: true },
  { day: "Wed", date: 24, hasDot: "error" }, { day: "Thu", date: 25 },
  { day: "Fri", date: 26, hasDot: "primary" }, { day: "Sat", date: 27 }, { day: "Sun", date: 28 },
]
const barHeights = [40, 55, 45, 65, 85, 70, 95, 75, 60, 40, 55, 50]

export default async function CashflowPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const data = await getDashboardKPIs()
  if (!data) return null
  const weeklyInflow = Math.round(data.inflowAmount * 0.35)

  const user = session.user

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[#005259] font-bold tracking-widest text-[10px] uppercase bg-[#cae8eb] px-3 py-1 rounded-full">Forecast Overview</span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] mt-4 leading-[1.05] tracking-tight">Predictive <br />Insight</h2>
            </div>
            <div className="bg-white border border-[#005259]/10 rounded-[2rem] p-6 flex items-center gap-4 max-w-md shadow-ambient-card">
              <div className="w-12 h-12 rounded-2xl bg-[#cae8eb] flex items-center justify-center text-[#005259]">
                <Sparkles size={24} />
              </div>
              <p className="text-[#005259] font-bold text-sm leading-relaxed">₹{weeklyInflow.toLocaleString()} expected this week. {data.overdueAmount > 0 ? `₹${data.overdueAmount.toLocaleString()} at risk.` : "Looking healthy!"}</p>
            </div>
          </div>
        </Scroll3D>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "This Week's Inflow", value: `₹${weeklyInflow.toLocaleString()}`, sub: "+12% vs last week", icon: Wallet, bg: "bg-white", textColor: "text-[#005259]", subBg: "bg-[#cae8eb] text-[#005259]" },
            { label: "Expected this Month", value: `₹${data.inflowAmount.toLocaleString()}`, sub: "Projection stable", icon: TrendingUp, bg: "bg-white", textColor: "text-[#1d1b18]", subBg: "bg-[#f3ede8] text-[#6f797a]" },
            { label: "At-Risk Inflow", value: `₹${data.overdueAmount.toLocaleString()}`, sub: `${data.alerts.length} critical overdue`, icon: AlertCircle, bg: "bg-[#ffdad6]/20", textColor: "text-[#ba1a1a]", subBg: "bg-[#ffdad6] text-[#ba1a1a]" },
          ].map((k, i) => (
            <Scroll3D key={i} delay={i * 120}>
              <div className={`${k.bg} rounded-[2rem] p-8 shadow-ambient-card relative overflow-hidden group tilt-card border border-[rgba(190,200,202,0.15)]`}>
                <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">{k.label}</p>
                <h3 className={`text-3xl font-black mt-3 ${k.textColor}`}>{k.value}</h3>
                <div className={`mt-6 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider w-fit px-3 py-1 rounded-full ${k.subBg}`}><span>{k.sub}</span></div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><k.icon size={96} /></div>
              </div>
            </Scroll3D>
          ))}
        </div>

        {/* Calendar Strip */}
        <Scroll3D>
          <section className="space-y-6">
            <h4 className="text-xl font-extrabold tracking-tight">Payment Timeline</h4>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {calendarDays.map((d) => (
                <div key={d.date} className={`flex-shrink-0 w-24 h-28 rounded-[2rem] flex flex-col items-center justify-center space-y-2 relative transition-all ${d.active ? "bg-[#005259] text-white shadow-ambient scale-105" : "bg-white border border-[rgba(190,200,202,0.15)] shadow-ambient-card hover:bg-[#f9f3ed]"}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${d.active ? "opacity-70" : "text-[#6f797a]"}`}>{d.day}</span>
                  <span className="text-2xl font-black">{d.date}</span>
                  {d.active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  {d.hasDot === "error" && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white shadow-sm" />}
                  {d.hasDot === "primary" && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#005259] rounded-full border-2 border-white shadow-sm" />}
                </div>
              ))}
            </div>
          </section>
        </Scroll3D>

        {/* Chart + Confidence */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Scroll3D direction="left" className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-10 border border-[rgba(190,200,202,0.15)] shadow-ambient-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div><h4 className="text-2xl font-black tracking-tight">30-Day Projection</h4><p className="text-sm font-medium text-[#6f797a]">Expected liquidity based on current payment cycles</p></div>
                <div className="flex gap-2 bg-[#f3ede8] p-1.5 rounded-xl">
                  <button className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#6f797a] hover:text-[#005259] transition-colors">Weekly</button>
                  <button className="px-4 py-2 bg-[#005259] text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-ambient">Monthly</button>
                </div>
              </div>
              <div className="relative h-64 w-full flex items-end gap-2 px-2">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-xl relative group transition-all duration-700 animate-grow-height" style={{ height: `${h}%`, backgroundColor: i === 4 || i === 8 ? "#005259" : "#f3ede8" }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#005259] text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-ambient z-10">
                      ₹{(h * 1200).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6 text-[10px] font-black text-[#6f797a] uppercase tracking-[0.2em] px-2"><span>Day 01</span><span>Day 10</span><span>Day 20</span><span>Day 30</span></div>
            </div>
          </Scroll3D>

          <Scroll3D direction="right">
            <div className="bg-white rounded-[2.5rem] p-10 border border-[rgba(190,200,202,0.15)] shadow-ambient-card flex flex-col h-full overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#cae8eb]/30 blur-3xl -z-0" />
              <div className="relative z-10 h-full flex flex-col">
                <h4 className="text-2xl font-black mb-8 tracking-tight">Payment Confidence</h4>
                <div className="space-y-6 flex-grow">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-[#005259] uppercase tracking-widest bg-[#cae8eb] px-2 py-0.5 rounded">High Confidence</span>
                    {data.topCustomers.slice(0, 2).map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[#f9f3ed] rounded-[1.5rem] hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#005259] flex items-center justify-center font-black text-white text-xs">{c.name.slice(0,2).toUpperCase()}</div>
                          <span className="text-sm font-bold truncate max-w-[100px]">{c.name}</span>
                        </div>
                        <span className="text-sm font-black text-[#005259]">₹{c.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {data.alerts.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-[#ba1a1a] uppercase tracking-widest bg-[#ffdad6] px-2 py-0.5 rounded">Low Confidence</span>
                      {data.alerts.slice(0, 2).map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-[#ffdad6]/20 border border-[#ba1a1a]/10 rounded-[1.5rem] hover:scale-[1.02] transition-transform">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ba1a1a] flex items-center justify-center font-black text-white text-xs">{a.name.slice(0,2).toUpperCase()}</div>
                            <span className="text-sm font-bold truncate max-w-[100px]">{a.name}</span>
                          </div>
                          <span className="text-sm font-black text-[#ba1a1a]">₹{a.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/alerts">
                  <button className="mt-10 w-full py-5 bg-[#005259] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#0f6c74] transition-all shadow-ambient active:scale-95">
                    Smart Follow-ups <Zap size={18} fill="currentColor" />
                  </button>
                </Link>
              </div>
            </div>
          </Scroll3D>
        </section>
      </main>
    </div>
  )
}
