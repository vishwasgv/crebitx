import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCustomers } from "@/app/actions/customers"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight, 
  ShieldCheck, 
  AlertTriangle,
  Users
} from "lucide-react"
import Link from "next/link"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddCustomerForm } from "@/components/customers/add-customer-form"
import { ImportCustomersDialog } from "@/components/customers/import-customers-dialog"
import { canManageCustomers } from "@/lib/permissions"

export default async function CustomersPage() {
  const session = await auth()
  if (!session) redirect("/login")
  
  const customers = await getCustomers()
  const user = session.user
  const canManage = canManageCustomers(user.role)

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={(customers || []).filter((c: any) => c.riskSnapshots?.[0]?.level === "RED").length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cae8eb] text-[#005259] text-[10px] font-black uppercase tracking-widest">
                <Users size={12} /> Directory
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
                Customer <br />Portfolio
              </h2>
            </div>
            <div className="flex gap-3">
              <ImportCustomersDialog />
              <Dialog>
                <DialogTrigger render={
                  <button className="h-14 px-8 rounded-2xl bg-[#005259] text-white font-black text-sm flex items-center gap-2 hover:bg-[#0f6c74] transition-all shadow-ambient active:scale-95">
                    <Plus size={20} /> Add New Customer
                  </button>
                } />
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                  </DialogHeader>
                  <AddCustomerForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Scroll3D>

        {/* Search & Filter Bar */}
        <Scroll3D delay={100}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bec8ca] group-focus-within:text-[#005259] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by business name, phone, or risk status..." 
                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white border border-[rgba(190,200,202,0.2)] shadow-ambient-card focus:ring-2 focus:ring-[#005259]/10 focus:border-[#005259]/20 transition-all outline-none font-medium"
              />
            </div>
            <button className="h-16 px-6 rounded-2xl bg-white border border-[rgba(190,200,202,0.2)] shadow-ambient-card font-bold text-sm flex items-center gap-2 hover:bg-[#f3ede8] transition-all whitespace-nowrap">
              <Filter size={20} /> Advanced Filters
            </button>
          </div>
        </Scroll3D>

        <div className="grid grid-cols-1 gap-4">
          {(customers || []).map((customer: any, i: number) => {
            const latestRisk = customer.riskSnapshots?.[0]
            const isCritical = latestRisk?.level === "RED"
            const outstanding = (customer.receivables || []).reduce((sum: number, r: any) => sum + (r.amount - r.paidAmount), 0)

            return (
              <Scroll3D key={customer.id} delay={i * 80}>
                <Link href={`/customers/${customer.id}`}>
                  <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] hover:border-[#005259]/30 transition-all group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                        isCritical ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#f3ede8] text-[#3f494a]"
                      }`}>
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-[#1d1b18] group-hover:text-[#005259] transition-colors">
                            {customer.name}
                          </h3>
                          {isCritical && <AlertTriangle size={16} className="text-[#ba1a1a]" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-[#6f797a] uppercase tracking-widest">
                          <span>ID: {customer.id.slice(-6).toUpperCase()}</span>
                          <span className="w-1 h-1 rounded-full bg-[#bec8ca]" />
                          <span>{customer.phone || "No phone"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 md:gap-16">
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">Outstanding</p>
                        <p className="text-xl font-black text-[#1d1b18]">₹{outstanding.toLocaleString()}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-[#6f797a] uppercase tracking-widest">Risk Level</p>
                        <div className={`flex items-center gap-1.5 justify-end text-xs font-black uppercase ${
                          latestRisk?.level === "RED" ? "text-[#ba1a1a]" : 
                          latestRisk?.level === "YELLOW" ? "text-[#703d15]" : "text-[#005259]"
                        }`}>
                          {latestRisk?.level === "GREEN" && <ShieldCheck size={14} />}
                          {latestRisk?.level || "N/A"}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <ChevronRight size={24} className="text-[#bec8ca] group-hover:text-[#005259] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Scroll3D>
            )
          })}
        </div>
      </main>
    </div>
  )
}


