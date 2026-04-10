import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Zap, Users, Globe, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PlansPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "For small shops getting started.",
      features: ["Up to 50 customers", "Manual reminders", "Basic dashboard", "Single business"],
      icon: Globe,
      color: "border-stone-200",
    },
    {
      name: "Pro",
      price: "₹499",
      period: "/month",
      description: "Automate your collections.",
      features: ["Unlimited customers", "WhatsApp automation", "Advanced risk scoring", "Priority support"],
      icon: Zap,
      color: "border-crebitx-teal border-2 scale-105 shadow-xl",
      popular: true,
    },
    {
      name: "Team",
      price: "₹999",
      period: "/month",
      description: "For larger distribution businesses.",
      features: ["Multiple staff access", "Custom industry presets", "Tally/Excel export", "API access"],
      icon: Users,
      color: "border-crebitx-gold",
    },
  ]

  return (
    <div className="min-h-screen bg-stone-50/50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft size={20} className="text-crebitx-teal" />
            </Button>
          </Link>
          <h1 className="font-bold text-xl text-crebitx-teal tracking-tight">Upgrade your Account</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-16">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-extrabold text-stone-900 tracking-tight">Choose the right plan for your growth</h2>
          <p className="text-stone-500 font-medium text-lg">Invest in your cashflow health. Recover money faster with CREBITX.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative bg-white overflow-hidden ${plan.color}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-crebitx-teal text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 text-crebitx-teal">
                  <plan.icon size={24} />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-stone-900">{plan.price}</span>
                  {plan.period && <span className="text-stone-400 font-bold text-sm">{plan.period}</span>}
                </div>
                
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-crebitx-green/10 flex items-center justify-center text-crebitx-green">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-sm font-medium text-stone-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className={`w-full h-12 font-bold ${plan.popular ? 'bg-crebitx-teal hover:bg-crebitx-teal/90' : 'bg-stone-900 hover:bg-stone-800'}`}>
                  {plan.price === "₹0" ? "Current Plan" : "Upgrade Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-20 bg-crebitx-teal/5 rounded-3xl p-12 text-center space-y-6 border border-crebitx-teal/10">
          <h3 className="text-2xl font-bold text-crebitx-teal">Need a custom solution for your enterprise?</h3>
          <p className="text-stone-500 font-medium max-w-2xl mx-auto">
            If you have more than 5000 customers or multiple business entities, our Team plan can be customized to your needs.
          </p>
          <Button variant="outline" className="border-crebitx-teal text-crebitx-teal hover:bg-crebitx-teal/5 font-bold h-12 px-8 rounded-full">
            Contact Sales Team
          </Button>
        </div>
      </main>
    </div>
  )
}
