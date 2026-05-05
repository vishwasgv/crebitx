import { EntryTag } from "@prisma/client"
import { format } from "date-fns"
import { CheckCircle, FileText, AlertCircle, TrendingUp, Info } from "lucide-react"

interface Entry {
  id: string
  amount: number
  tag: EntryTag
  note: string | null
  eventDate: Date
}

export function LedgerTimeline({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#bec8ca] space-y-3">
        <Info size={48} className="opacity-10" />
        <p className="font-bold uppercase text-[10px] tracking-widest">No transactions recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {entries.map((entry) => {
        const isPayment = entry.tag === "PAYMENT"
        const isSale = entry.tag === "SALE"
        const isAdjustment = entry.tag === "ADJUSTMENT"
        const isReturn = entry.tag === "RETURN"

        return (
          <div key={entry.id} className="relative pl-12 animate-fade-in-3d">
            {/* Timeline Dot */}
            <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2 border-[#fef8f3] z-10 ${
              isPayment ? "bg-[#4CAF50]" : 
              isSale ? "bg-[#005259]" : 
              "bg-[#703d15]"
            }`} />
            
            <div className={`p-5 rounded-[1.5rem] border transition-all hover:shadow-ambient-card group ${
              isPayment ? "bg-[#4CAF50]/5 border-[#4CAF50]/15" : 
              isSale ? "bg-white border-[rgba(190,200,202,0.15)] shadow-ambient-card" :
              "bg-[#f9f3ed] border-[rgba(190,200,202,0.15)]"
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPayment ? "bg-[#4CAF50]/10 text-[#2e7d32]" :
                    isSale ? "bg-[#005259]/10 text-[#005259]" :
                    "bg-[#703d15]/10 text-[#703d15]"
                  }`}>
                    {isPayment && <CheckCircle size={16} />}
                    {isSale && <FileText size={16} />}
                    {(isAdjustment || isReturn) && <AlertCircle size={16} />}
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#6f797a] block leading-none mb-0.5">{entry.tag}</span>
                    <span className="text-sm font-bold text-[#1d1b18]">{isPayment ? "Payment Received" : isSale ? "New Sale Created" : "Ledger Adjustment"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-extrabold tracking-tight ${
                    isPayment ? "text-[#2e7d32]" : 
                    isSale ? "text-[#005259]" : 
                    "text-[#703d15]"
                  }`}>
                    {isPayment ? "—" : "+"}₹{entry.amount.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-[#bec8ca] uppercase tracking-tighter">
                    {format(new Date(entry.eventDate), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
              
              {entry.note && (
                <div className="bg-[#fef8f3]/50 p-3 rounded-xl border border-[rgba(190,200,202,0.1)]">
                  <p className="text-xs text-[#3f494a] font-medium leading-relaxed italic">
                    &ldquo;{entry.note}&rdquo;
                  </p>
                </div>
              )}

              {isPayment && (
                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[#2e7d32] uppercase tracking-widest">
                  <TrendingUp size={12} /> Positive Flow Effect
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
