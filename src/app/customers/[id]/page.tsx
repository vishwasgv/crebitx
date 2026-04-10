import { getCustomerById } from "@/app/actions/customers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, CreditCard, Clock, MapPin, MoreVertical, MessageSquare } from "lucide-react"
import { LedgerTimeline } from "@/components/ledger/ledger-timeline"
import { AddEntryForm } from "@/components/ledger/add-entry-form"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppDialog } from "@/components/alerts/whatsapp-dialog"

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerById(params.id)

  if (!customer) notFound()

  const totalOutstanding = customer.receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0)
  const risk = customer.riskSnapshots[0]
  const riskColor = risk?.level === "RED" ? "text-red-500" : risk?.level === "YELLOW" ? "text-crebitx-gold" : "text-crebitx-green"
  const riskBg = risk?.level === "RED" ? "bg-red-50" : risk?.level === "YELLOW" ? "bg-crebitx-gold/10" : "bg-crebitx-green/10"

  return (
    <div className="min-h-screen bg-stone-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/customers">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft size={20} className="text-crebitx-teal" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${risk?.level === "RED" ? "bg-red-500" : risk?.level === "YELLOW" ? "bg-crebitx-gold" : "bg-crebitx-green"}`}>
                {customer.name[0]}
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-lg text-crebitx-teal leading-tight">{customer.name}</h1>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Partner</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-stone-400">
              <MoreVertical size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-8">
        {/* Balance & Risk Section */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm border-none bg-white">
            <CardContent className="p-6">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Balance</p>
              <h2 className="text-2xl font-extrabold text-crebitx-teal tracking-tight">₹{totalOutstanding.toLocaleString()}</h2>
              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-stone-400 uppercase">
                <Clock size={10} /> Live Status
              </div>
            </CardContent>
          </Card>
          
          <Card className={`shadow-sm border-none ${riskBg}`}>
            <CardContent className="p-6">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Risk Profile</p>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${riskColor === "text-red-500" ? "bg-red-500" : riskColor === "text-crebitx-gold" ? "bg-crebitx-gold" : "bg-crebitx-green"}`}></span>
                <span className={`text-xl font-bold tracking-tight ${riskColor}`}>{risk?.level || "GREEN"}</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-stone-200/50 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${riskColor === "text-red-500" ? "bg-red-500" : riskColor === "text-crebitx-gold" ? "bg-crebitx-gold" : "bg-crebitx-green"}`} style={{ width: `${risk?.score || 100}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Info Pills */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm shrink-0">
            <CreditCard size={14} className="text-crebitx-teal" />
            <span className="text-xs font-bold text-stone-600">Limit: ₹{(customer.creditProfile?.creditLimit || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm shrink-0">
            <Clock size={14} className="text-crebitx-teal" />
            <span className="text-xs font-bold text-stone-600">{customer.creditProfile?.paymentCycle} Days Cycle</span>
          </div>
          {customer.address && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm shrink-0">
              <MapPin size={14} className="text-crebitx-teal" />
              <span className="text-xs font-bold text-stone-600 truncate max-w-[150px]">{customer.address}</span>
            </div>
          )}
        </section>

        {/* Transaction Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${customer.phone}`}>
            <Button className="w-full bg-stone-900 hover:bg-stone-800 font-bold rounded-xl h-12">
              <Phone size={18} className="mr-2" /> Call Now
            </Button>
          </a>
          <WhatsAppDialog 
            customerName={customer.name} 
            amount={`₹${totalOutstanding.toLocaleString()}`} 
            phone={customer.phone || ""} 
          />
        </div>

        {/* Timeline Header */}
        <div className="flex justify-center">
          <span className="bg-stone-200/50 text-stone-500 text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">Transaction Timeline</span>
        </div>

        {/* Ledger Timeline */}
        <LedgerTimeline entries={customer.ledgerEvents} />
        
        {/* Floating Action Bar Container */}
        <div className="h-32" /> {/* Spacer for the fixed bar */}
        
        {/* Add Entry Form */}
        <AddEntryForm customerId={customer.id} />
      </main>
    </div>
  )
}
