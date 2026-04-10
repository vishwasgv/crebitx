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
      <div className="flex flex-col items-center justify-center h-64 text-stone-400 space-y-2">
        <Info size={48} className="opacity-20" />
        <p className="font-medium uppercase text-[10px] tracking-widest">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-32">
      {entries.map((entry) => {
        const isPayment = entry.tag === "PAYMENT"
        const isSale = entry.tag === "SALE"
        const isAdjustment = entry.tag === "ADJUSTMENT"
        const isReturn = entry.tag === "RETURN"

        return (
          <div key={entry.id} className={`flex ${isPayment ? "justify-end" : "justify-start"} w-full`}>
            <div className={`relative max-w-[85%] sm:max-w-[70%] group`}>
              <div className={`p-4 rounded-2xl shadow-sm border ${
                isPayment ? "bg-crebitx-green/5 border-crebitx-green/20 rounded-tr-none" : 
                isSale ? "bg-crebitx-teal/5 border-crebitx-teal/20 rounded-tl-none" :
                "bg-stone-50 border-stone-200 rounded-tl-none"
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPayment ? "bg-crebitx-green/10 text-crebitx-green" :
                    isSale ? "bg-crebitx-teal/10 text-crebitx-teal" :
                    "bg-stone-100 text-stone-500"
                  }`}>
                    {isPayment && <CheckCircle size={16} />}
                    {isSale && <FileText size={16} />}
                    {(isAdjustment || isReturn) && <AlertCircle size={16} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{entry.tag}</span>
                    <span className="text-sm font-bold text-stone-900">{isPayment ? "Payment Received" : isSale ? "New Sale" : "Adjustment"}</span>
                  </div>
                </div>
                
                <p className={`text-2xl font-extrabold tracking-tight ${
                  isPayment ? "text-crebitx-green" : 
                  isSale ? "text-crebitx-teal" : 
                  "text-stone-700"
                }`}>
                  ₹{entry.amount.toLocaleString()}
                </p>

                {entry.note && (
                  <p className="mt-2 text-xs text-stone-500 font-medium leading-relaxed italic border-l-2 border-stone-200 pl-2">
                    {entry.note}
                  </p>
                )}

                <div className="mt-3 flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase tracking-tighter">
                  <span>{format(new Date(entry.eventDate), "MMM d, yyyy • h:mm a")}</span>
                  {isPayment && <TrendingUp size={12} className="text-crebitx-green" />}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
