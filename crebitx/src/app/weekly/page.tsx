import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { getDisciplineSummary, getWeeklyReview } from "@/app/actions/operating-intelligence"
import { Sparkles, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Zap, Target, BookOpen, Quote } from "lucide-react"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"
import { WeeklySuggestionButtons } from "@/components/weekly/weekly-suggestion-buttons"

export default async function WeeklyReviewPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [data, review, discipline] = await Promise.all([
    getDashboardKPIs(),
    getWeeklyReview(),
    getDisciplineSummary(),
  ])
  if (!data) return null

  const user = session.user
  const findings = review?.findings || []
  const suggestions = review?.suggestions || []
  const weeklyScore = discipline?.completionRate ?? 100

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts.length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3ede8] text-[#703d15] text-[10px] font-black uppercase tracking-widest">
                <Calendar size={12} /> Cycle Reflection
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
                Weekly <br />Review
              </h2>
            </div>
            <div className="bg-[#005259]/8 border border-[#005259]/15 rounded-2xl p-6 flex items-center gap-4 max-w-md shadow-sm">
              <Sparkles className="text-[#005259]" size={24} />
              <p className="text-[#005259] font-bold text-sm leading-relaxed">
                {review?.summary || "Weekly review is ready once customer, ledger, and reminder activity is available."}
              </p>
            </div>
          </div>
        </Scroll3D>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <Scroll3D>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-ambient-card border border-[rgba(190,200,202,0.15)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 text-[#f3ede8] opacity-50"><Quote size={80} /></div>
                 <div className="relative z-10 space-y-6">
                   <h3 className="text-2xl font-black tracking-tight">Executive Reflection</h3>
                   <div className="space-y-6">
                     {(findings.length ? findings : [
                       { title: "Risk spread is currently stable", detail: "Add customer transactions and reminders to generate richer weekly findings.", severity: "INFO" },
                     ]).map((finding: any, index: number) => {
                       const Icon = finding.severity === "HIGH" ? AlertTriangle : TrendingUp
                       return (
                         <div key={finding.id || index} className="flex gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${finding.severity === "HIGH" ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#cae8eb] text-[#005259]"}`}><Icon size={24} /></div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold">{finding.title}</h4>
                              <p className="text-sm font-medium text-[#6f797a] leading-relaxed">{finding.detail}</p>
                            </div>
                         </div>
                       )
                     })}
                   </div>
                 </div>
              </div>
            </Scroll3D>

            <Scroll3D delay={200}>
              <div className="space-y-6">
                <h3 className="text-xl font-extrabold tracking-tight">Rule Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(suggestions.length ? suggestions : [
                    { id: "empty-suggestion", title: "Collect more operating data", detail: "Record reminders, promises, payments, and follow-ups to generate rule recommendations." },
                  ]).map((rule: any, i: number) => (
                    <div key={rule.id || i} className="bg-white rounded-[2rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] group hover:border-[#005259]/30 transition-all">
                      <div className={`w-10 h-10 rounded-xl ${i % 2 === 0 ? "bg-[#cae8eb]/40 text-[#005259]" : "bg-[#ffdad6]/40 text-[#ba1a1a]"} flex items-center justify-center mb-6`}><BookOpen size={20} /></div>
                      <h4 className="text-lg font-black text-[#1d1b18]">{rule.title}</h4>
                      <p className="text-sm font-medium text-[#6f797a] mt-2 leading-relaxed">{rule.detail}</p>
                      {review?.id && rule.id !== "empty-suggestion" && (
                        <WeeklySuggestionButtons reviewId={review.id} suggestionId={rule.id} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Scroll3D>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <Scroll3D direction="right">
              <div className="bg-[#005259] rounded-[2.5rem] p-10 text-white shadow-ambient relative overflow-hidden group">
                 <div className="relative z-10 text-center space-y-4">
                    <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest">Weekly Collection Score</p>
                    <div className="text-7xl font-black tracking-tighter">{weeklyScore}<span className="text-2xl text-white/40">/100</span></div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
                      <CheckCircle2 size={14} /> Follow-up Discipline
                    </div>
                    <p className="text-sm font-medium text-white/70 pt-6 leading-relaxed">
                      {discipline?.coaching || "Follow-up discipline will update from scheduled reminder jobs."}
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
                    <span className="text-sm font-bold text-[#3f494a]">Completed Follow-ups</span>
                    <span className="text-sm font-black text-[#005259]">{discipline?.completed ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#3f494a]">Pending Follow-ups</span>
                    <span className="text-sm font-black text-[#703d15]">{discipline?.pending ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#3f494a]">Missed Follow-ups</span>
                    <span className="text-sm font-black text-[#ba1a1a]">{discipline?.missed ?? 0}</span>
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
