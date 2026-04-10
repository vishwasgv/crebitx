import { getCustomers } from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Plus, Search, Phone, Mail, ArrowRight, Bell, User, Sparkles, PlusCircle } from "lucide-react"
import Link from "next/link"
import { AddCustomerForm } from "@/components/customers/add-customer-form"
import { ImportCustomersDialog } from "@/components/customers/import-customers-dialog"
import { Input } from "@/components/ui/input"

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24 font-sans antialiased">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-crebitx-teal font-bold text-xl tracking-tight">CREBITX</Link>
            <span className="text-stone-300">/</span>
            <h1 className="font-bold text-lg text-stone-600">Customers</h1>
          </div>

          <div className="flex items-center gap-2">
            <ImportCustomersDialog />
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-crebitx-teal hover:bg-crebitx-teal/90 font-bold">
                  <Plus size={18} className="mr-2" /> Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Enter the details of your new customer to start tracking their credit.
                  </DialogDescription>
                </DialogHeader>
                <AddCustomerForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
          <Search className="text-stone-400 ml-2" size={20} />
          <Input 
            placeholder="Search customers by name, phone or email..." 
            className="border-none shadow-none focus-visible:ring-0" 
          />
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50 hover:bg-stone-50">
                <TableHead className="w-[300px] text-[10px] font-bold uppercase tracking-widest text-stone-400">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Contact</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Risk Level</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-stone-400">Outstanding</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-stone-500 font-medium italic">
                    No customers found. Click "Add Customer" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => {
                  const totalOutstanding = customer.receivables.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0)
                  const risk = customer.riskSnapshots[0]
                  const riskColor = risk?.level === "RED" ? "bg-red-500" : risk?.level === "YELLOW" ? "bg-crebitx-gold" : "bg-crebitx-green"

                  return (
                    <TableRow key={customer.id} className="group hover:bg-stone-50/50 transition-colors cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${riskColor}`}>
                            {customer.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{customer.name}</div>
                            <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                              Cycle: {customer.creditProfile?.paymentCycle} Days
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                              <Phone size={12} className="text-crebitx-teal opacity-50" /> {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                              <Mail size={12} className="text-crebitx-teal opacity-50" /> {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white shadow-sm ${riskColor}`}>
                          {risk?.level || "GREEN"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-crebitx-teal text-lg">₹{totalOutstanding.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/customers/${customer.id}`}>
                          <Button variant="ghost" size="icon" className="group-hover:text-crebitx-teal group-hover:bg-crebitx-teal/5 rounded-full transition-all">
                            <ArrowRight size={18} />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-lg border-t flex justify-around items-center px-4 py-3 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-stone-400 hover:text-crebitx-teal">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[10px] font-bold uppercase tracking-tight">Dashboard</span>
        </Link>
        <Link href="/customers" className="flex flex-col items-center gap-1 text-crebitx-teal">
          <User size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Customers</span>
        </Link>
        <Link href="/customers" className="flex flex-col items-center gap-1 text-stone-400 hover:text-crebitx-teal">
          <PlusCircle size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Actions</span>
        </Link>
        <Link href="/alerts" className="flex flex-col items-center gap-1 text-stone-400 hover:text-crebitx-teal">
          <Bell size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Alerts</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1 text-stone-400 hover:text-crebitx-teal">
          <Sparkles size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Settings</span>
        </Link>
      </nav>
    </div>
  )
}
