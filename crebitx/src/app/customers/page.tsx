import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getCustomers } from "@/app/actions/customers"
import { Users } from "lucide-react"
import { Scroll3D } from "@/components/ui/scroll-3d"
import { TopNav } from "@/components/navigation/top-nav"
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog"
import { ImportCustomersDialog } from "@/components/customers/import-customers-dialog"
import { CustomerList } from "@/components/customers/customer-list"

export default async function CustomersPage() {
  const session = await auth()
  if (!session) redirect("/login")
  
  const customers = await getCustomers()
  const user = session.user

  return (
    <div className="min-h-screen bg-[#fef8f3] text-[#1d1b18] font-sans antialiased pb-20">
      <TopNav user={user} alertsCount={(customers || []).filter((c: any) => c.riskSnapshots?.[0]?.level === "RED").length} />

      <main className="px-6 py-8 max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <Scroll3D>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
                Customer <br />Portfolio
              </h2>
            </div>
            <div className="flex gap-3">
              <ImportCustomersDialog />
              <AddCustomerDialog />
            </div>
          </div>
        </Scroll3D>

        {(customers || []).length === 0 && (
          <Scroll3D delay={200}>
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white rounded-[2.5rem] border border-[rgba(190,200,202,0.2)] shadow-ambient-card">
              <div className="w-20 h-20 rounded-[1.5rem] bg-[#f3ede8] flex items-center justify-center text-[#005259]">
                <Users size={36} />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-2xl font-extrabold text-[#1d1b18]">No customers yet</h3>
                <p className="text-sm font-medium text-[#6f797a] leading-relaxed">
                  Add your first customer manually or import a CSV to get started with risk scoring and collections.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <AddCustomerDialog
                  triggerLabel="Add First Customer"
                  triggerClassName="h-12 px-8 rounded-2xl bg-[#005259] text-white font-black text-sm flex items-center gap-2 hover:bg-[#0f6c74] transition-all shadow-ambient active:scale-95"
                />
                <ImportCustomersDialog />
              </div>
            </div>
          </Scroll3D>
        )}

        {(customers || []).length > 0 && (
          <CustomerList customers={customers || []} />
        )}
      </main>
    </div>
  )
}
