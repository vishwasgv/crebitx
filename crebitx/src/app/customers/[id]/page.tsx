import { getCustomerById } from "@/app/actions/customers"
import { getCollectionPattern } from "@/app/actions/operating-intelligence"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Phone,
  CreditCard,
  Clock,
  MapPin,
  MoreVertical,
  History,
  ShieldAlert,
  LayoutDashboard,
  Users,
  Sparkles,
  Bell,
  Settings,
  Handshake,
  BarChart3,
} from "lucide-react"
import { LedgerTimeline } from "@/components/ledger/ledger-timeline"
import { AddEntryForm } from "@/components/ledger/add-entry-form"
import { WhatsAppDialog } from "@/components/alerts/whatsapp-dialog"
import { ActivityDialog } from "@/components/customers/activity-form"
import { PaymentPromisesPanel } from "@/components/customers/payment-promises-panel"
import { CreditCheckPanel } from "@/components/customers/credit-check-panel"
import { Scroll3D } from "@/components/ui/scroll-3d"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const customer = await getCustomerById(resolvedParams.id)

  if (!customer) notFound()

  const collectionPattern = await getCollectionPattern(customer.id)
  const collectionPatterns = collectionPattern?.patterns || []
  const totalCollectionAttempts = collectionPatterns.reduce((sum: number, pattern: any) => sum + Number(pattern.count || 0), 0)
  const bestCollectionPattern = collectionPatterns[0]
  const totalOutstanding = (customer.receivables || []).reduce((sum: number, r: any) => sum + (r.amount - r.paidAmount), 0)
  const risk = customer.riskSnapshots?.[0]
  const riskLevel = risk?.level || "GREEN"

  const riskConfig = (({
    RED: { text: "text-[#ba1a1a]", bg: "bg-[#ffdad6]/40", dot: "bg-[#ba1a1a]", label: "High Risk" },
    YELLOW: { text: "text-[#703d15]", bg: "bg-[#ffdcc6]/40", dot: "bg-[#F4C430]", label: "Medium Risk" },
    GREEN: { text: "text-[#005259]", bg: "bg-[#cae8eb]/40", dot: "bg-[#4CAF50]", label: "Low Risk" },
  } as Record<string, { text: string; bg: string; dot: string; label: string }>)[riskLevel]) ?? {
    text: "text-[#005259]",
    bg: "bg-[#cae8eb]/40",
    dot: "bg-[#4CAF50]",
    label: "Low Risk",
  }

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-32">
      <header className="sticky top-0 z-40 glass-nav border-b border-[rgba(190,200,202,0.2)] shadow-ambient flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#f3ede8]">
              <ArrowLeft size={20} className="text-[#3f494a]" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${riskConfig.dot}`}>
              {customer.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-[#1d1b18] leading-tight">{customer.name}</h1>
              <span className="text-[10px] font-bold text-[#6f797a] uppercase tracking-widest">Partner since 2024</span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f3ede8] transition-colors">
          <MoreVertical size={20} className="text-[#3f494a]" />
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-8 space-y-10">
        <Scroll3D>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] tilt-card">
              <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest mb-2">Current Balance</p>
              <h2 className="text-4xl font-extrabold text-[#005259] tracking-tight">Rs. {totalOutstanding.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[#6f797a] bg-[#f9f3ed] w-fit px-3 py-1.5 rounded-full">
                <Clock size={12} /> Last updated today
              </div>
            </div>

            <div className={`${riskConfig.bg} rounded-[2rem] p-8 border border-[rgba(190,200,202,0.1)] tilt-card`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest mb-1">Risk Assessment</p>
                  <h2 className={`text-2xl font-extrabold tracking-tight ${riskConfig.text}`}>{riskConfig.label}</h2>
                </div>
                <ShieldAlert size={24} className={riskConfig.text} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-[#6f797a] uppercase">
                  <span>Trust Score</span>
                  <span>{risk?.score || 100}%</span>
                </div>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${riskConfig.dot}`} style={{ width: `${risk?.score || 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Scroll3D>

        <Scroll3D>
          <section className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {[
              { icon: CreditCard, label: `Limit: Rs. ${(customer.creditProfile?.creditLimit || 0).toLocaleString()}` },
              { icon: Clock, label: `${customer.creditProfile?.paymentCycle || 30} Day Cycle` },
              { icon: MapPin, label: customer.address || "No address" },
            ].map((pill, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white px-5 py-2.5 rounded-full border border-[rgba(190,200,202,0.15)] shadow-ambient-card shrink-0">
                <pill.icon size={14} className="text-[#005259]" />
                <span className="text-xs font-bold text-[#3f494a]">{pill.label}</span>
              </div>
            ))}
          </section>
        </Scroll3D>

        <Scroll3D>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href={`tel:${customer.phone}`}>
              <button className="w-full h-14 bg-[#1d1b18] hover:bg-[#32302d] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-ambient active:scale-95">
                <Phone size={18} /> Call Partner
              </button>
            </a>
            <WhatsAppDialog customerName={customer.name} amount={`Rs. ${totalOutstanding.toLocaleString()}`} phone={customer.phone || ""} customerId={customer.id} />
            <ActivityDialog customerId={customer.id} />
          </div>
        </Scroll3D>

        <Scroll3D>
          <CreditCheckPanel customerId={customer.id} />
        </Scroll3D>

        <section className="space-y-6">
          <Scroll3D>
            <div className="flex items-center gap-3 mb-2">
              <Handshake size={20} className="text-[#005259]" />
              <h3 className="text-xl font-bold text-[#1d1b18]">Promise-to-Pay Tracker</h3>
            </div>
          </Scroll3D>
          <PaymentPromisesPanel customerId={customer.id} promises={customer.paymentPromises || []} />
        </section>

        <Scroll3D>
          <div className="rounded-[2rem] bg-[#f9f3ed] p-6 border border-[#005259]/10">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={20} className="text-[#005259]" />
              <h3 className="text-xl font-bold text-[#1d1b18]">Collection Pattern</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">Total Attempts</p>
                <p className="text-2xl font-black text-[#005259]">{totalCollectionAttempts}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">Best Channel</p>
                <p className="text-2xl font-black text-[#005259]">{bestCollectionPattern?.channel || "N/A"}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">Best Tone</p>
                <p className="text-2xl font-black text-[#005259]">{bestCollectionPattern?.tone || "N/A"}</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold text-[#6f797a]">
              {collectionPattern?.bestFollowUpPattern || "This updates from saved call, WhatsApp, and follow-up outcomes in the backend."}
            </p>
          </div>
        </Scroll3D>

        <section className="space-y-6">
          <Scroll3D>
            <div className="flex items-center gap-3 mb-2">
              <History size={20} className="text-[#005259]" />
              <h3 className="text-xl font-bold text-[#1d1b18]">Transaction Ledger</h3>
            </div>
          </Scroll3D>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[rgba(190,200,202,0.5)] via-[rgba(190,200,202,0.2)] to-transparent" />
            <LedgerTimeline entries={customer.ledgerEvents} />
          </div>
        </section>

        <div className="pt-10 pb-20">
          <Scroll3D>
            <div className="bg-white rounded-[2rem] p-8 border border-[rgba(190,200,202,0.15)] shadow-ambient">
              <h4 className="text-lg font-bold text-[#1d1b18] mb-6 flex items-center gap-2">
                <CreditCard size={18} className="text-[#005259]" /> Record New Transaction
              </h4>
              <AddEntryForm customerId={customer.id} />
            </div>
          </Scroll3D>
        </div>
      </main>

      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 glass-nav rounded-t-3xl border-t border-[rgba(190,200,202,0.2)] shadow-[0_-12px_32px_rgba(35,33,30,0.06)]">
        <Link href="/dashboard" className="flex flex-col items-center text-[#6f797a] hover:text-[#005259] transition-colors">
          <LayoutDashboard size={22} /><span className="text-[11px] mt-0.5">Dashboard</span>
        </Link>
        <Link href="/customers" className="flex flex-col items-center text-[#005259] font-bold bg-[#cae8eb]/40 rounded-xl px-3 py-1">
          <Users size={22} fill="currentColor" /><span className="text-[11px] mt-0.5">Customers</span>
        </Link>
        <Link href="/actions" className="flex flex-col items-center text-[#6f797a] hover:text-[#005259] transition-colors">
          <Sparkles size={22} /><span className="text-[11px] mt-0.5">Actions</span>
        </Link>
        <Link href="/alerts" className="flex flex-col items-center text-[#6f797a] hover:text-[#005259] transition-colors">
          <Bell size={22} /><span className="text-[11px] mt-0.5">Alerts</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center text-[#6f797a] hover:text-[#005259] transition-colors">
          <Settings size={22} /><span className="text-[11px] mt-0.5">Settings</span>
        </Link>
      </nav>
    </div>
  )
}



