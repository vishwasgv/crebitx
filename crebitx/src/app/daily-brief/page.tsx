import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Ban,
  ChevronRight,
  Star,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { getCustomerMLIntelligence } from "@/app/actions/customers"
import { getDailyBrief, getNextBestActions, getRecoveryWins } from "@/app/actions/operating-intelligence"
import { TopNav } from "@/components/navigation/top-nav"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { HeroActionButtons } from "@/components/actions/hero-action-buttons"
import { DailyBriefItemButton } from "@/components/actions/daily-brief-item-button"

export default async function DailyBriefPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [data, brief, nextActions, recoveryWins] = await Promise.all([
    getDashboardKPIs(),
    getDailyBrief(),
    getNextBestActions(5),
    getRecoveryWins(),
  ])
  if (!data) return null

  const user = session.user
  const briefItems: any[] = brief?.items || []

  // Top priority action: prefer a real next-best-action (has an acceptable actionId),
  // fall back to the brief's own NEXT_ACTION item (completable, not accept/dismiss-able).
  const topAction = nextActions[0]
  const topBriefItem = briefItems.find((i) => i.type === "NEXT_ACTION")

  // "Today's Focus": the brief's risk/overdue signals plus any remaining next-best-actions
  // not already shown as the hero.
  const focusItems = [
    ...briefItems.filter((i) => i.type !== "NEXT_ACTION"),
    ...nextActions.slice(topAction ? 1 : 0),
  ]

  const wins = (recoveryWins || []).filter((w: any) => w.id !== "win-empty")
  const overdueAmount = Number(brief?.moneyAtRisk ?? data.overdueAmount ?? 0)
  const expectedInflow = Number(data.inflowAmount ?? 0)

  // ML-predicted expected payment date per customer (survival-model timeline
  // predictions, nearest unpaid invoice). Fetched per unique customer shown
  // on this page; failures degrade to "no prediction yet" rather than blocking render.
  const focusCustomerIds = Array.from(
    new Set(
      [topAction?.customerId, ...focusItems.map((i: any) => i.customerId)].filter(Boolean) as string[]
    )
  )
  const expectedDateEntries = await Promise.all(
    focusCustomerIds.map(async (customerId) => {
      const mlData = await getCustomerMLIntelligence(customerId)
      const predictions = mlData?.timeline_predictions || []
      const nearest = predictions
        .map((p: any) => p.predictedPaidDate)
        .filter(Boolean)
        .sort()[0]
      return [customerId, nearest || null] as const
    })
  )
  const expectedDateByCustomer = new Map(expectedDateEntries)

  const formatExpectedDate = (customerId?: string) => {
    if (!customerId) return null
    const iso = expectedDateByCustomer.get(customerId)
    if (!iso) return null
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const focusIcon = (item: any) => {
    if (item.type === "TOP_RISK") return ShieldAlert
    if (item.type === "TOP_OVERDUE") return Clock
    if (item.actionType === "HOLD_CREDIT_AND_CALL") return Ban
    return Users
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={data.alerts?.length || 0} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        <Scroll3D>
          <div className="flex flex-col gap-2">
            <span className="text-[#005259] font-semibold tracking-widest uppercase text-[10px]">
              Morning Briefing
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-[#1d1b18] tracking-tight">
              Focus on what <span className="font-bold text-[#005259]">matters most</span> today.
            </h2>
          </div>
        </Scroll3D>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <Scroll3D className="md:col-span-7 lg:col-span-8">
            <div className="bg-gradient-to-br from-[#005259] to-[#0F6C74] rounded-[2rem] p-8 md:p-10 text-white shadow-ambient relative overflow-hidden group h-full">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Zap size={18} className="text-[#9eeaf3]" />
                  <span className="uppercase tracking-widest text-[10px] font-bold">Top Priority Action</span>
                </div>
                {topAction ? (
                  <>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight leading-tight">{topAction.title}</h3>
                    <p className="text-white/90 text-lg mb-4 max-w-md leading-relaxed">{topAction.reason}</p>
                    {formatExpectedDate(topAction.customerId) && (
                      <p className="text-[#9eeaf3] text-xs font-bold uppercase tracking-widest mb-6">
                        Expected payment: {formatExpectedDate(topAction.customerId)}
                      </p>
                    )}
                    <HeroActionButtons actionId={topAction.id} />
                  </>
                ) : topBriefItem ? (
                  <>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight leading-tight">{topBriefItem.title}</h3>
                    <p className="text-white/90 text-lg mb-8 max-w-md leading-relaxed">{topBriefItem.detail}</p>
                    <DailyBriefItemButton itemId={topBriefItem.id} />
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl font-bold mb-4 tracking-tight leading-tight">All clear for now</h3>
                    <p className="text-white/90 text-lg mb-8 max-w-md leading-relaxed">
                      No urgent action needed. Collections are currently under control.
                    </p>
                  </>
                )}
              </div>
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            </div>
          </Scroll3D>

          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            <Scroll3D direction="right">
              <div className="bg-white rounded-[2rem] p-6 shadow-ambient-card border border-[rgba(190,200,202,0.15)] transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg">
                    <Clock size={20} />
                  </div>
                  <span className="text-[#ba1a1a] text-xs font-bold uppercase tracking-widest">Urgent</span>
                </div>
                <p className="text-[#6f797a] text-sm font-medium">Overdue amount</p>
                <p className="text-3xl font-black text-[#1d1b18] tracking-tighter mt-1">
                  Rs. {overdueAmount.toLocaleString()}
                </p>
              </div>
            </Scroll3D>
            <Scroll3D direction="right" delay={100}>
              <div className="bg-white rounded-[2rem] p-6 shadow-ambient-card border border-[rgba(190,200,202,0.15)] transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#cae8eb] text-[#005259] rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[#005259] text-xs font-bold uppercase tracking-widest">Expected</span>
                </div>
                <p className="text-[#6f797a] text-sm font-medium">Expected inflow</p>
                <p className="text-3xl font-black text-[#1d1b18] tracking-tighter mt-1">
                  Rs. {expectedInflow.toLocaleString()}
                </p>
              </div>
            </Scroll3D>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-[#1d1b18] tracking-tight">Today's Focus</h3>
              <Link
                href="/customers"
                className="text-[#005259] text-sm font-bold flex items-center gap-1 hover:underline"
              >
                View All Customers <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-4">
              {focusItems.map((item: any, i: number) => {
                const Icon = focusIcon(item)
                const href = item.customerId ? `/customers/${item.customerId}` : "/customers"
                return (
                  <Scroll3D key={item.id || i} delay={i * 60}>
                    <Link
                      href={href}
                      className="bg-[#f9f3ed] rounded-[1.5rem] p-6 flex items-center gap-6 transition-all duration-300 group hover:translate-x-2 hover:bg-white"
                    >
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#005259] shadow-sm shrink-0">
                        <Icon size={20} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-[#1d1b18] truncate">{item.title}</p>
                        <p className="text-sm text-[#6f797a] truncate">{item.detail || item.reason}</p>
                        {formatExpectedDate(item.customerId) && (
                          <p className="text-[10px] font-bold text-[#005259] uppercase tracking-widest mt-1">
                            Expected payment: {formatExpectedDate(item.customerId)}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-[#bec8ca] group-hover:text-[#005259] transition-colors shrink-0"
                      />
                    </Link>
                  </Scroll3D>
                )
              })}

              {focusItems.length === 0 && (
                <div className="bg-white rounded-[1.5rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] text-sm font-bold text-[#6f797a]">
                  No follow-ups need attention right now.
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1d1b18] tracking-tight mb-8">Recovery Wins</h3>
            <div className="flex flex-col gap-4">
              {wins.map((win: any, i: number) => (
                <Scroll3D key={win.id} direction="right" delay={i * 80}>
                  <div className="bg-[#f3ede8]/60 rounded-[1.5rem] p-5 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2">
                      <Star size={14} className="text-[#005259]" fill="currentColor" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#005259]">
                        Success
                      </span>
                    </div>
                    <p className="text-[#1d1b18] font-semibold">{win.title}</p>
                    <p className="text-xs text-[#6f797a] mt-1">{win.detail}</p>
                  </div>
                </Scroll3D>
              ))}

              {wins.length === 0 && (
                <div className="bg-[#f3ede8]/60 rounded-[1.5rem] p-5 text-sm font-medium text-[#6f797a]">
                  Recovery wins will show up here as payments come in.
                </div>
              )}

              <Scroll3D direction="right" delay={wins.length * 80 + 100}>
                <div className="mt-2 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-[#005259] to-[#0F6C74] p-6 relative">
                  <TrendingDown size={120} className="absolute -right-6 -bottom-6 text-white/5 rotate-12" />
                  <div className="relative z-10 flex items-center gap-3">
                    <Sparkles size={18} className="text-white" />
                    <p className="text-white text-xs font-medium leading-relaxed">
                      {wins.length > 0
                        ? `${wins.length} recovery win${wins.length === 1 ? "" : "s"} logged recently.`
                        : "Recovery insights will appear once payments are recorded."}
                    </p>
                  </div>
                </div>
              </Scroll3D>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
