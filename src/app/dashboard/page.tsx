import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  PlusCircle, 
  CreditCard, 
  Send, 
  Phone, 
  User, 
  Bell,
  Sparkles,
  ArrowRight,
  LogOut,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { getDashboardKPIs } from "@/app/actions/dashboard"
import { WhatsAppDialog } from "@/components/alerts/whatsapp-dialog"

export default async function DashboardPage() {
  const session = await auth()
  
  // Manual session check since we removed middleware for Next.js 16 compatibility
  if (!session || !session.user) {
    redirect("/login")
  }

  const data = await getDashboardKPIs()
  if (!data) return <div className="p-8 text-center">Loading dashboard data...</div>

  const user = session.user

  const kpis = [
    { title: "Total receivables", value: `₹${data.outstandingAmount.toLocaleString()}`, trend: "Updated now", icon: TrendingUp, color: "text-crebitx-teal" },
    { title: "Overdue amount", value: `₹${data.overdueAmount.toLocaleString()}`, trend: data.overdueAmount > 0 ? "Action required" : "Healthy", icon: AlertTriangle, color: data.overdueAmount > 0 ? "text-red-500" : "text-crebitx-green" },
    { title: "Expected inflow (7D)", value: `₹${data.inflowAmount.toLocaleString()}`, trend: "Next 7 days", icon: Calendar, color: "text-crebitx-gold" },
  ]

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-crebitx-teal leading-tight">CREBITX</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/alerts">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} className="text-stone-500" />
                {data.alerts.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
              </Button>
            </Link>
            <form action={async () => {
              "use server"
              await signOut()
            }}>
              <Button variant="ghost" size="icon" className="text-stone-400" type="submit">
                <LogOut size={20} />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="shadow-sm border-none bg-white">
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold text-[10px] uppercase tracking-wider">{kpi.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className={`text-3xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</h2>
                    <p className="text-[10px] text-stone-400 font-bold mt-1 flex items-center gap-1">
                      {kpi.trend}
                    </p>
                  </div>
                  <kpi.icon size={24} className={kpi.color} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insight Bar */}
        <div className="bg-crebitx-teal/10 border border-crebitx-teal/20 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-crebitx-teal rounded-full flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-crebitx-teal font-bold text-lg leading-tight">
              {data.overdueAmount > 0 
                ? `₹${data.overdueAmount.toLocaleString()} is stuck beyond due dates — follow up with your top debtors today.`
                : "Your cashflow is looking healthy. Great job on collections!"}
            </p>
          </div>
          <Link href="/alerts">
            <Button className="bg-crebitx-teal hover:bg-crebitx-teal/90 hidden sm:flex font-bold">Take Action</Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/customers">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 shadow-sm border-stone-100 hover:bg-stone-50">
              <PlusCircle size={20} className="text-crebitx-teal" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Entry</span>
            </Button>
          </Link>
          <Link href="/customers">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 shadow-sm border-stone-100 hover:bg-stone-50">
              <User size={20} className="text-crebitx-teal" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Customers</span>
            </Button>
          </Link>
          <Link href="/alerts">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 shadow-sm border-stone-100 hover:bg-stone-50">
              <Send size={20} className="text-crebitx-teal" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Reminders</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 shadow-sm border-stone-100 hover:bg-stone-50">
              <Sparkles size={20} className="text-crebitx-teal" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Needs Action Today */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-crebitx-teal tracking-tight">Needs action today</h3>
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Critical follow-ups</p>
              </div>
              <Link href="/alerts" className="text-[10px] font-bold text-crebitx-teal uppercase hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
              {data.alerts.length === 0 ? (
                <Card className="p-12 text-center border-dashed bg-white">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-crebitx-green opacity-20" size={48} />
                    <p className="text-stone-400 font-medium uppercase text-[10px] tracking-widest">No critical follow-ups today</p>
                  </div>
                </Card>
              ) : (
                data.alerts.slice(0, 3).map((alert, idx) => (
                  <Card key={idx} className="shadow-sm border-none overflow-hidden hover:shadow-md transition-shadow bg-white">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-crebitx-teal font-bold text-lg">
                          {alert.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900">{alert.name}</h4>
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="text-red-500">₹{alert.amount.toLocaleString()}</span>
                            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                            <span className="text-stone-400">{alert.overdue}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={`tel:${alert.phone}`}>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-stone-100">
                            <Phone size={18} className="text-stone-600" />
                          </Button>
                        </a>
                        <WhatsAppDialog 
                          customerName={alert.name} 
                          amount={`₹${alert.amount.toLocaleString()}`} 
                          phone={alert.phone || ""} 
                        />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar / Stats */}
          <div className="lg:col-span-5 space-y-8">
            <Card className="shadow-sm border-none bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-crebitx-teal">Overdue Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex flex-col justify-end">
                <div className="flex-1 flex items-end gap-2 mb-4">
                  <div className="flex-1 bg-crebitx-teal/10 h-[40%] rounded-t-sm"></div>
                  <div className="flex-1 bg-crebitx-teal/20 h-[60%] rounded-t-sm"></div>
                  <div className="flex-1 bg-crebitx-teal/30 h-[45%] rounded-t-sm"></div>
                  <div className="flex-1 bg-crebitx-teal/50 h-[80%] rounded-t-sm"></div>
                  <div className="flex-1 bg-crebitx-teal h-[95%] rounded-t-sm"></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                  <span>Week 5</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-crebitx-teal">Top Outstanding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.topCustomers.length === 0 ? (
                  <p className="text-sm text-stone-400 font-medium italic">No outstanding receivables.</p>
                ) : (
                  data.topCustomers.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-600">{item.name}</span>
                        <span className="text-crebitx-teal">₹{item.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-crebitx-teal rounded-full" style={{ width: `${Math.min(100, (item.amount / (data.outstandingAmount || 1)) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <Link href="/customers">
          <Button className="w-14 h-14 rounded-2xl bg-crebitx-teal hover:bg-crebitx-teal/90 shadow-xl flex items-center justify-center active:scale-95 transition-transform">
            <PlusCircle size={28} />
          </Button>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-lg border-t flex justify-around items-center px-4 py-3 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-crebitx-teal">
          <TrendingUp size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Dashboard</span>
        </Link>
        <Link href="/customers" className="flex flex-col items-center gap-1 text-stone-400 hover:text-crebitx-teal">
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
