import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Crebitx Logo" className="h-12 w-12 object-contain" />
            <span className="font-black text-2xl tracking-tighter text-crebitx-teal">CREBITX</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-bold text-stone-600">Log In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-crebitx-teal hover:bg-crebitx-teal/90 font-bold px-6 rounded-full shadow-lg shadow-crebitx-teal/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-crebitx-teal/5 border border-crebitx-teal/10 text-crebitx-teal font-bold text-xs uppercase tracking-widest animate-fade-in">
            <Zap size={14} className="text-crebitx-gold" /> The Smart Assistant for SMBs
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-stone-900 tracking-tight leading-[1.1]">
            Cashflow <span className="text-crebitx-teal">today.</span><br />
            Confidence <span className="text-crebitx-gold">tomorrow.</span>
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop chasing payments manually. CrebitX tells you where your money is stuck, who is risky, and how to recover it faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-16 px-10 rounded-full bg-stone-900 hover:bg-stone-800 text-lg font-bold shadow-2xl">
                Start Free Trial <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full border-2 font-bold text-lg">
                View Pricing
              </Button>
            </Link>
          </div>
          
          {/* Dashboard Preview Simulation */}
          <div className="relative mt-20 max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,168,204,0.15)] border-8 border-stone-100 bg-stone-50 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <img src="/logo.png" alt="watermark" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 w-96" />
            <div className="p-8 space-y-8 blur-[2px] pointer-events-none grayscale-[0.5]">
               <div className="grid grid-cols-3 gap-6">
                 <div className="h-32 bg-white rounded-2xl shadow-sm" />
                 <div className="h-32 bg-white rounded-2xl shadow-sm" />
                 <div className="h-32 bg-white rounded-2xl shadow-sm" />
               </div>
               <div className="h-96 bg-white rounded-2xl shadow-sm" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent flex items-end justify-center pb-20">
               <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border shadow-xl flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-crebitx-green animate-pulse" />
                 <span className="text-sm font-bold text-stone-700 uppercase tracking-widest">Live Multi-Tenant Intelligence</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-stone-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: "Smart Ledger", 
                desc: "WhatsApp-style timeline for sales and payments. No complex accounting jargon.",
                icon: Zap,
                color: "bg-crebitx-teal"
              },
              { 
                title: "Risk Engine", 
                desc: "Automatic Green/Yellow/Red labels for customers based on their payment behavior.",
                icon: ShieldCheck,
                color: "bg-crebitx-gold"
              },
              { 
                title: "Daily Alerts", 
                desc: "Wake up to clear actions. Know exactly who to call and what to avoid.",
                icon: TrendingUp,
                color: "bg-crebitx-green"
              }
            ].map((f, i) => (
              <div key={i} className="space-y-6 group p-8 rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center text-white shadow-lg`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">{f.title}</h3>
                <p className="text-stone-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t bg-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Crebitx Logo" className="h-8 w-8 object-contain" />
            <span className="font-black text-xl tracking-tighter text-crebitx-teal">CREBITX</span>
          </div>
          <p className="text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            Cashflow today. Confidence tomorrow.
          </p>
          <div className="text-stone-400 font-medium text-sm">
            © 2026 Crebitx Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
