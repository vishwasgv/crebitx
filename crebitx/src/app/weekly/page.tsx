import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Zap, Target, BookOpen, Quote } from "lucide-react"
import Link from "next/link"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"

export default async function WeeklyReviewPage() {
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
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
                Weekly <br />Review
              </h2>
            </div>
            <div className="bg-[#005259]/8 border border-[#005259]/15 rounded-2xl p-6 flex items-center gap-4 max-w-md shadow-sm">
              <Sparkles className="text-[#005259]" size={24} />
              <p className="text-[#005259] font-bold text-sm leading-relaxed">System refined 3 collection rules based on last week's behavior.</p>
            </div>
          </div>
        </Scroll3D>

        {/* Weekly Highlights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Insights */}
          <div className="lg:col-span-8 space-y-8">
            <Scroll3D>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient-card border border-[rgba(190,200,202,0.15)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 text-[#f3ede8] opacity-50"><Quote size={80} /></div>
                 <div className="relative z-10 space-y-6">
                   <h3 className="text-2xl font-black tracking-tight">Executive Reflection</h3>
                   <div className="space-y-6">
                     <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#cae8eb] flex items-center justify-center text-[#005259] shrink-0"><TrendingUp size={24} /></div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold">Velocity is Up</h4>
                          <p className="text-sm font-medium text-[#6f797a] leading-relaxed">Collection cycles shortened by 2.5 days on average. The "Gentle" WhatsApp tone is converting 15% better than last week.</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] shrink-0"><AlertTriangle size={24} /></div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold">Concentration Risk</h4>
                          <p className="text-sm font-medium text-[#6f797a] leading-relaxed">40% of outstanding is held by 2 customers. We recommend diversifying credit exposure across smaller tiers.</p>
                        </div>
                     </div>
                   </div>
                 </div>
              </div>
            </Scroll3D>

            <Scroll3D delay={200}>
              <div className="space-y-6">
                <h3 className="text-xl font-extrabold tracking-tight">Rule Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: "Extend Grace Period", desc: "For Green-tier customers to 5 days. High correlation with loyalty.", icon: BookOpen, color: "text-[#005259]", bg: "bg-[#cae8eb]/40" },
                    { title: "Auto-Hold Credit", desc: "When Red-tier reaches 80% limit. Prevents further loss exposure.", icon: Zap, color: "text-[#ba1a1a]", bg: "bg-[#ffdad6]/40" },
                  ].map((rule, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] group hover:border-[#005259]/30 transition-all">
                      <div className={`w-10 h-10 rounded-xl ${rule.bg} ${rule.color} flex items-center justify-center mb-6`}><rule.icon size={20} /></div>
                      <h4 className="text-lg font-black text-[#1d1b18]">{rule.title}</h4>
                      <p className="text-sm font-medium text-[#6f797a] mt-2 leading-relaxed">{rule.desc}</p>
                      <button className="mt-6 flex items-center gap-2 text-[10px] font-black text-[#005259] uppercase tracking-widest hover:translate-x-1 transition-transform">
                        Apply Rule <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Scroll3D>
          </div>

          {/* Sidebar Score */}
          <div className="lg:col-span-4 space-y-10">
            <Scroll3D direction="right">
              <div className="bg-[#005259] rounded-[2.5rem] p-10 text-white shadow-ambient relative overflow-hidden group">
                 <div className="relative z-10 text-center space-y-4">
                    <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest">Weekly Collection Score</p>
                    <div className="text-7xl font-black tracking-tighter">88<span className="text-2xl text-white/40">/100</span></div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
                      <CheckCircle2 size={14} /> Top 5% Performance
                    </div>
                    <p className="text-sm font-medium text-white/70 pt-6 leading-relaxed">
                      Your recovery rate this week is higher than 95% of businesses in your sector.
                    </p>
                 </div>
                 <Target size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
              </div>
            </Scroll3D>

            <Scroll3D direction="right" delay={200}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient-card border border-[rgba(190,200,202,0.15)]">
                <h4 className="text-lg font-black mb-6 tracking-tight">Team Discipline</h4>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#3f494a]">Follow-up Consistency</span>
                    <span className="text-sm font-black text-[#005259]">98%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#3f494a]">Data Entry Accuracy</span>
                    <span className="text-sm font-black text-[#005259]">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#3f494a]">Template Usage</span>
                    <span className="text-sm font-black text-[#703d15]">72%</span>
                  </div>
                </div>
              </div>
            </Scroll3D>
          </div>
        </div>
      </main>
    </div>
  )
}
