"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { addLedgerEntry } from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Send, Lock, FileText, CheckCircle } from "lucide-react"

const entrySchema = z.object({
  amount: z.coerce.number().min(1, "Amount is required"),
  tag: z.enum(["SALE", "PAYMENT", "RETURN", "ADJUSTMENT"]),
  note: z.string().optional(),
})

export function AddEntryForm({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false)
  const [tag, setTag] = useState<"SALE" | "PAYMENT" | "RETURN" | "ADJUSTMENT">("SALE")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      tag: "SALE",
      amount: 0,
    },
  })

  async function onSubmit(data: z.infer<typeof entrySchema>) {
    setLoading(true)
    const result = await addLedgerEntry({
      customerId,
      amount: data.amount,
      tag: data.tag,
      note: data.note,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${data.tag} entry added!`)
      reset()
      router.refresh()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t z-50">
      <div className="max-w-xl mx-auto space-y-3">
        <Tabs defaultValue="SALE" onValueChange={(v) => setTag(v as any)} className="w-full">
          <TabsList className="grid grid-cols-4 h-12 p-1 bg-stone-100/50 rounded-xl">
            <TabsTrigger value="SALE" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-crebitx-teal data-[state=active]:text-white">
              Sale
            </TabsTrigger>
            <TabsTrigger value="PAYMENT" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-crebitx-green data-[state=active]:text-white">
              Payment
            </TabsTrigger>
            <TabsTrigger value="RETURN" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Return
            </TabsTrigger>
            <TabsTrigger value="ADJUSTMENT" className="rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-stone-500 data-[state=active]:text-white">
              Adj.
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
          <input type="hidden" value={tag} {...register("tag")} />
          <div className="flex-1 flex items-center bg-stone-100 rounded-full px-4 py-2 border border-stone-200 focus-within:ring-2 focus-within:ring-crebitx-teal/20 transition-all">
            <span className="text-stone-400 font-bold mr-2">₹</span>
            <Input 
              type="number" 
              {...register("amount")} 
              placeholder="0.00" 
              className="border-none shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-lg font-bold"
            />
            <div className="w-px h-6 bg-stone-300 mx-2" />
            <Input 
              {...register("note")} 
              placeholder="Add note..." 
              className="border-none shadow-none focus-visible:ring-0 bg-transparent h-8 p-0 text-xs font-medium"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
              tag === "PAYMENT" ? "bg-crebitx-green hover:bg-crebitx-green/90" : 
              tag === "SALE" ? "bg-crebitx-teal hover:bg-crebitx-teal/90" :
              tag === "RETURN" ? "bg-red-500 hover:bg-red-600" :
              "bg-stone-700 hover:bg-stone-800"
            }`}
          >
            <Send size={20} className="text-white ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
