import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { TopNav } from "@/components/navigation/top-nav"
import { Scroll3D, TiltCard } from "@/components/ui/scroll-3d"
import { CollectionChart } from "@/components/dashboard/collection-chart"
import { 
  PlusCircle, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles,
  Zap
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const data = await getDashboardKPIs()
  if (!data) return <div className="p-8 text-center text-[#3f494a]">Loading dashboard data...</div>

  const user = session.user

  return (
    <div className="min-h-screen bg-[#f9f3ed] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Hero Brief */}
        <Scroll3D>
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1b18] leading-[1.1] tracking-tight">
              Command <br />Dashboard
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="bg-[#cae8eb] text-[#005259] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> AI Analysis Live
              </div>
              <p className="text-sm font-semibold text-[#6f797a]">
                You have {data.alerts.length} urgent follow-ups today.
              </p>
            </div>
          </div>
        </Scroll3D>

        {/* KPI Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main KPI */}
          <div className="md:col-span-7">
            <Scroll3D direction="left">
              <div className="bg-[#005259] rounded-[2.5rem] p-8 text-white shadow-ambient h-full relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-white/60 font-bold text-xs uppercase tracking-[0.2em]">Total Outstanding</p>
                  <h3 className="text-5xl md:text-6xl font-black mt-4 tracking-tighter">
                    ₹{data.outstandingAmount.toLocaleString()}
                  </h3>
                  <div className="mt-12 flex items-center gap-4">
                    <Link href="/actions" className="bg-white text-[#005259] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#f9f3ed] transition-all flex items-center gap-2">
                      Take Action <ArrowRight size={16} />
                    </Link>
                    <div className="text-white/80 text-xs font-medium">
                      <span className="text-white font-bold">12% improved</span> vs last month
                    </div>
                  </div>
                </div>
                <TrendingUp size={240} className="absolute -right-20 -bottom-20 text-white/5 group-hover:scale-110 transition-transform duration-700" />
              </div>
            </Scroll3D>
          </div>

          {/* Secondary KPIs */}
          <div className="md:col-span-5 grid grid-cols-1 gap-6">
            <Scroll3D direction="right">
              <div className="bg-white rounded-[2rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.2)] h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#6f797a] font-bold text-[10px] uppercase tracking-widest">At Critical Risk</p>
                    <h4 className="text-3xl font-black text-[#ba1a1a] mt-2">₹{data.overdueAmount.toLocaleString()}</h4>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <p className="text-xs font-medium text-[#3f494a] mt-6 leading-relaxed">
                  Most of this is from <span className="font-bold">Global Tech Solutions</span>. Recommendation: Pause new credit.
                </p>
              </div>
            </Scroll3D>

            <Scroll3D direction="right" delay={100}>
              <div className="bg-[#f9f3ed] rounded-[2rem] p-8 border border-[#005259]/10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[#005259] font-bold text-[10px] uppercase tracking-widest">Expected Inflow (7d)</p>
                  <h4 className="text-3xl font-black text-[#1d1b18] mt-2">₹{data.inflowAmount.toLocaleString()}</h4>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-[#005259] uppercase tracking-wider bg-[#cae8eb] w-fit px-3 py-1 rounded-full">
                  <Zap size={10} /> High Confidence
                </div>
              </div>
            </Scroll3D>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Risk Heatmap (Mock Visualization) */}
          <div className="lg:col-span-7 space-y-6">
            <Scroll3D>
              <div className="flex justify-between items-end">
                <h3 className="text-xl font-extrabold text-[#1d1b18] tracking-tight">Collection Velocity</h3>
                <Link href="/collections" className="text-xs font-bold text-[#005259] uppercase hover:underline tracking-widest">View Analytics</Link>
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)]">
                <CollectionChart />
              </div>
            </Scroll3D>
          </div>

          {/* Top Outstanding */}
          <div className="lg:col-span-5 space-y-6">
            <Scroll3D direction="right">
              <div className="flex justify-between items-end">
                <h3 className="text-xl font-extrabold text-[#1d1b18] tracking-tight">Top Outstanding</h3>
                <Link href="/customers" className="text-xs font-bold text-[#005259] uppercase hover:underline tracking-widest">Manage All</Link>
              </div>
              <div className="space-y-6 mt-4">
                {data.topCustomers.length === 0 ? (
                  <p className="text-sm text-[#6f797a] font-medium italic">No outstanding receivables.</p>
                ) : (
                  data.topCustomers.slice(0, 5).map((item: any, idx: number) => {
                    const pct = Math.min(100, (item.amount / (data.outstandingAmount || 1)) * 100)
                    return (
                      <div key={idx} className="space-y-2 group">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-[#1d1b18] group-hover:text-[#005259] transition-colors">{item.name}</span>
                          <span className="text-[#005259]">₹{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="h-2.5 bg-[#f3ede8] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full animate-grow-width transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: idx === 0 ? "#005259" : idx === 1 ? "#0f6c74" : "#4e696c",
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Scroll3D>
          </div>
        </div>
      </main>

      {/* ── FAB ── */}
      <div className="fixed bottom-8 right-6 z-50">
        <Link href="/customers">
          <button className="w-16 h-16 bg-[#005259] text-white rounded-[1.5rem] shadow-ambient-lg flex items-center justify-center transition-transform active:scale-90 hover:scale-105 hover:bg-[#0f6c74]">
            <PlusCircle size={28} />
          </button>
        </Link>
      </div>
    </div>
  )
}
