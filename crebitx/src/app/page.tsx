import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle,
  Star,
  Upload,
  Wallet,
  BarChart3,
  Check,
  Menu,
} from "lucide-react"
import { Scroll3D, TiltCard } from "@/components/ui/scroll-3d"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { CrebitXLogo } from "@/components/brand/crebitx-logo"
import { pricingPlans } from "@/lib/pricing"

const stats = [
  { endValue: 14, decimals: 0, prefix: "", suffix: "-day", label: "Free trial with full access" },
  { endValue: 5, decimals: 0, prefix: "", suffix: " min", label: "Typical setup from CSV import" },
  { endValue: 100, decimals: 0, prefix: "", suffix: "%", label: "Visibility on open receivables" },
]

const features = [
  {
    title: "Command Dashboard",
    desc: "Wake up to a curated morning brief. Know exactly who owes you, how much is stuck, and who to call first.",
    icon: TrendingUp,
    color: "bg-[#005259]",
    tag: "AI-Powered",
  },
  {
    title: "Risk Engine",
    desc: "Automatic Green / Yellow / Red labels for every customer based on their real payment behavior — no spreadsheets.",
    icon: ShieldCheck,
    color: "bg-[#703d15]",
    tag: "Smart Scoring",
  },
  {
    title: "Daily Alerts",
    desc: "One-tap to call, send WhatsApp reminders, or mark a Promise-to-Pay. Every action tracked automatically.",
    icon: Zap,
    color: "bg-[#486366]",
    tag: "One-Tap Actions",
  },
  {
    title: "Bulk Import",
    desc: "Onboard fast with CSV or Excel. CREBITX maps customers and receivables so you are not retyping ledgers.",
    icon: Upload,
    color: "bg-[#0f6c74]",
    tag: "Fast setup",
  },
  {
    title: "Cashflow & Runway",
    desc: "See where cash is stuck versus coming in. A live view of receivables and timing so you can plan the week.",
    icon: Wallet,
    color: "bg-[#486366]",
    tag: "Forecast",
  },
  {
    title: "Collections & Weekly Review",
    desc: "Track performance over time and get a weekly executive reflection with rule suggestions you can apply in Settings.",
    icon: BarChart3,
    color: "bg-[#703d15]",
    tag: "Rhythm",
  },
]

const testimonials = [
  {
    name: "Rajan M.",
    role: "Textile trader, Gujarat",
    quote: "I open CrebitX every morning and know exactly which customers need a call — no more digging through registers.",
    rating: 5,
  },
  {
    name: "Sunita A.",
    role: "Pharma distributor, Rajasthan",
    quote: "The risk labels and daily brief feel built for how we actually run credit, not for accountants.",
    rating: 5,
  },
  {
    name: "Deepak N.",
    role: "Hardware supplier, Tamil Nadu",
    quote: "Clear actions, WhatsApp reminders, and one ledger — our team finally works from the same picture.",
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fef8f3] font-sans antialiased overflow-x-hidden">

      {/* ── Floating Navbar ── */}
      <header className="fixed top-0 z-50 w-full border-b border-[rgba(190,200,202,0.3)] bg-[#fef8f3]/96 backdrop-blur-sm">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 sm:px-7 lg:px-10">
          <CrebitXLogo variant="wordmark" href="/" priority />

          <nav aria-label="Page sections" className="hidden items-center gap-9 md:flex">
            <a href="#features" className="text-[14px] font-medium text-[#4d5658] transition-colors hover:text-[#005259]">
              Features
            </a>
            <a href="#how" className="text-[14px] font-medium text-[#4d5658] transition-colors hover:text-[#005259]">
              How it works
            </a>
            <a href="#pricing" className="text-[14px] font-medium text-[#4d5658] transition-colors hover:text-[#005259]">
              Pricing
            </a>
            <Link href="/login" className="text-[14px] font-medium text-[#4d5658] transition-colors hover:text-[#005259]">
              Login
            </Link>
            <Link href="/register" className="text-[14px] font-medium text-[#005259] transition-colors hover:text-[#0a5f68]">
              Signup
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-[#4d5658] hover:text-[#005259] px-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-bold text-white bg-[#005259] hover:bg-[#0f6c74] px-4 py-2 rounded-full transition-colors"
            >
              Sign up
            </Link>
            <details className="relative md:hidden">
              <summary className="list-none cursor-pointer flex h-9 w-9 items-center justify-center rounded-md text-[#3f494a] hover:bg-[#f3ede8] [&::-webkit-details-marker]:hidden">
                <Menu size={18} strokeWidth={2} aria-hidden />
                <span className="sr-only">Open menu</span>
              </summary>
              <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-[rgba(190,200,202,0.35)] bg-[#fef8f3]/98 py-2 shadow-ambient-lg backdrop-blur-xl">
                <a
                  href="#features"
                  className="block px-4 py-3 text-[13px] font-medium tracking-wide text-[#3f494a] hover:bg-[#f3ede8] hover:text-[#005259]"
                >
                  Features
                </a>
                <a
                  href="#how"
                  className="block px-4 py-3 text-[13px] font-medium tracking-wide text-[#3f494a] hover:bg-[#f3ede8] hover:text-[#005259]"
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  className="block px-4 py-3 text-[13px] font-medium tracking-wide text-[#3f494a] hover:bg-[#f3ede8] hover:text-[#005259]"
                >
                  Pricing
                </a>
                <Link
                  href="/login"
                  className="block px-4 py-3 text-[13px] font-medium tracking-wide text-[#3f494a] hover:bg-[#f3ede8] hover:text-[#005259]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 text-[13px] font-medium tracking-wide text-[#005259] hover:bg-[#f3ede8] hover:text-[#0a5f68]"
                >
                  Signup
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="scene-3d pt-28 sm:pt-32 pb-20 sm:pb-24 px-5 sm:px-6 gradient-hero min-h-[90vh] sm:min-h-screen flex items-center relative overflow-hidden">
        {/* Background depth layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#cae8eb]/20 blur-3xl animate-hero-float" />
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-[#005259]/8 blur-3xl" style={{ animation: "heroFloat 8s ease-in-out infinite 2s" }} />
          <div className="absolute top-40 left-1/3 w-64 h-64 rounded-full bg-[#ffdcc6]/20 blur-3xl" style={{ animation: "heroFloat 7s ease-in-out infinite 1s" }} />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-3xl animate-fade-up-3d">

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#1d1b18] tracking-tight leading-[1.08] mb-6 sm:mb-8">
              Cashflow{" "}
              <span className="text-[#005259]">today.</span>
              <br />
              Confidence{" "}
              <span style={{ color: "#703d15" }}>tomorrow.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#3f494a] font-medium leading-relaxed mb-8 sm:mb-10 max-w-xl">
              CrebitX turns your receivables into a daily action plan — who owes you, who is at risk,
              and the next step to recover cash without spreadsheets or guesswork.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 rounded-full bg-[#1d1b18] hover:bg-[#32302d] text-white text-lg font-bold shadow-ambient-lg transition-all hover:scale-105">
                  Start Free Trial <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-10 rounded-full border-2 border-[#bec8ca] font-bold text-lg text-[#1d1b18] hover:border-[#005259] hover:text-[#005259] transition-all"
                >
                  View Pricing
                </Button>
              </a>
            </div>

            {/* Trust line */}
            <p className="mt-6 text-xs text-[#6f797a] font-medium uppercase tracking-widest">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>

        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="py-20 px-6 bg-[#005259]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {stats.map((s, i) => (
            <Scroll3D key={i} delay={i * 120}>
              <div className="space-y-2">
                <div className="text-5xl font-black text-[#a2eff8]">
                  <AnimatedCounter endValue={s.endValue} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="text-sm font-semibold text-[#a2eff8]/70 uppercase tracking-widest">{s.label}</div>
              </div>
            </Scroll3D>
          ))}
        </div>
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#a2eff8]/55 mt-14 max-w-2xl mx-auto leading-relaxed">
          Multi-tenant data isolation · Verification on signup · Owner &amp; staff roles · Audit-friendly actions
        </p>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-32 px-6 bg-[#f9f3ed]">
        <div className="max-w-7xl mx-auto">
          <Scroll3D>
            <div className="mb-16 max-w-2xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#005259]">
                Built for the chaos of SMB finance
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-[#1d1b18] tracking-tight leading-tight">
                One platform for collections, risk, and cashflow.
              </h2>
              <p className="text-[#3f494a] font-medium leading-relaxed">
                Hardware, ceramics, wholesale, and distribution businesses use CrebitX for risk labels,
                daily alerts, bulk import, cashflow views, collections tracking, and owner rules — without
                replacing your existing books.
              </p>
            </div>
          </Scroll3D>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Scroll3D key={i} delay={i * 150}>
                <TiltCard className="space-y-6 p-8 rounded-3xl bg-white shadow-ambient-card hover:shadow-ambient transition-all duration-300 h-full">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center text-white shadow-ambient`}>
                      <f.icon size={26} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#3f494a] bg-[#f3ede8] px-3 py-1 rounded-full">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1d1b18]">{f.title}</h3>
                  <p className="text-[#3f494a] font-medium leading-relaxed">{f.desc}</p>
                </TiltCard>
              </Scroll3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-32 px-6 bg-[#fef8f3]">
        <div className="max-w-7xl mx-auto">
          <Scroll3D>
            <div className="mb-16 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#005259]">Simple as WhatsApp</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#1d1b18] tracking-tight mt-3">
                3 steps. That&apos;s it.
              </h2>
            </div>
          </Scroll3D>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Add your customers & sales", desc: "Import via CSV or add manually. CREBITX builds the ledger automatically.", icon: "📋" },
              { step: "02", title: "Get your morning brief", desc: "Every morning: who owes what, who is at risk, who to call first. All in one view.", icon: "☀️" },
              { step: "03", title: "Take action with one tap", desc: "Call, WhatsApp, mark Promise-to-Pay. Every action is logged and tracked.", icon: "⚡" },
            ].map((item, i) => (
              <Scroll3D key={i} delay={i * 150}>
                <div className="relative">
                  <div className="text-6xl font-black text-[#bec8ca]/60 mb-4">{item.step}</div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-[#1d1b18] mb-3">{item.title}</h3>
                  <p className="text-[#3f494a] font-medium leading-relaxed">{item.desc}</p>
                </div>
              </Scroll3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-32 px-6 bg-[#fef8f3] scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Scroll3D>
            <div className="mb-16 text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#005259]">Pricing</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#1d1b18] tracking-tight leading-tight">
                Start free. Scale when collections run on autopilot.
              </h2>
              <p className="text-[#3f494a] font-medium">
                Same tiers everywhere — scroll here for the snapshot, or open the{" "}
                <Link href="/plans" className="text-[#005259] font-bold underline-offset-4 hover:underline">
                  full plans page
                </Link>{" "}
                anytime (no login required).
              </p>
            </div>
          </Scroll3D>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, i) => (
              <Scroll3D key={plan.name} delay={i * 100}>
                <TiltCard
                  className={`relative h-full flex flex-col p-8 rounded-3xl bg-white shadow-ambient-card border transition-all duration-300 ${
                    plan.popular
                      ? "border-[#005259] ring-2 ring-[#005259]/20 scale-[1.02]"
                      : "border-[rgba(190,200,202,0.25)]"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-white bg-[#005259] px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-[#f3ede8] flex items-center justify-center text-[#005259] mb-6">
                    <plan.icon size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1d1b18]">{plan.name}</h3>
                  <p className="text-sm font-medium text-[#6f797a] mt-2 flex-1">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mt-8 mb-6">
                    <span className="text-4xl font-black text-[#1d1b18]">{plan.price}</span>
                    {plan.period && (
                      <span className="text-[#6f797a] font-bold text-sm">{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-10">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm font-medium text-[#3f494a]">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#cae8eb] flex items-center justify-center shrink-0 text-[#005259]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-auto inline-flex w-full h-12 items-center justify-center rounded-full font-bold text-base transition-colors ${
                      plan.popular
                        ? "bg-[#005259] hover:bg-[#0f6c74] text-white"
                        : "bg-[#1d1b18] hover:bg-[#32302d] text-white"
                    }`}
                  >
                    {plan.price === "₹0" ? "Start free" : "Get started"}
                  </Link>
                </TiltCard>
              </Scroll3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-32 px-6 bg-[#f9f3ed]">
        <div className="max-w-7xl mx-auto">
          <Scroll3D>
            <div className="mb-16 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#005259]">Built with SMB owners</span>
              <h2 className="text-4xl font-black text-[#1d1b18] tracking-tight mt-3">Why teams switch to CrebitX</h2>
            </div>
          </Scroll3D>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Scroll3D key={i} delay={i * 150}>
                <TiltCard className="p-8 rounded-3xl bg-white shadow-ambient-card h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={16} className="fill-[#F4C430] text-[#F4C430]" />
                    ))}
                  </div>
                  <p className="text-[#1d1b18] font-medium leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <div className="font-bold text-[#1d1b18]">{t.name}</div>
                    <div className="text-xs text-[#6f797a] font-semibold mt-1">{t.role}</div>
                  </div>
                </TiltCard>
              </Scroll3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 bg-[#005259] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#0f6c74] opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#a2eff8]/10 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Scroll3D>
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                Your money is waiting.<br />
                <span className="text-[#a2eff8]">Go get it.</span>
              </h2>
              <p className="text-xl text-[#a2eff8]/80 font-medium">
                Start free today and give your team a clear collections rhythm — every morning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-16 px-12 rounded-full bg-white hover:bg-[#f9f3ed] text-[#005259] text-lg font-black shadow-ambient-lg transition-all hover:scale-105">
                    Start Free Trial <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm text-[#a2eff8]/70 font-semibold">
                  <CheckCircle size={16} className="text-[#4CAF50]" />
                  No credit card required
                </div>
              </div>
            </div>
          </Scroll3D>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 border-t border-[rgba(190,200,202,0.25)] bg-[#fef8f3] px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <CrebitXLogo variant="wordmark" href="/" className="opacity-90 hover:opacity-100 transition-opacity" />
            <p className="text-[#6f797a] font-bold text-[10px] uppercase tracking-[0.2em] max-w-xs leading-relaxed">
              Cashflow today. Confidence tomorrow.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1d1b18]">Product</p>
              <a href="#features" className="block font-semibold text-[#6f797a] hover:text-[#005259]">
                Features
              </a>
              <a href="#how" className="block font-semibold text-[#6f797a] hover:text-[#005259]">
                How it works
              </a>
              <a href="#pricing" className="block font-semibold text-[#6f797a] hover:text-[#005259]">
                Pricing
              </a>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1d1b18]">Account</p>
              <Link href="/login" className="block font-semibold text-[#6f797a] hover:text-[#005259]">
                Log in
              </Link>
              <Link href="/register" className="block font-semibold text-[#6f797a] hover:text-[#005259]">
                Register
              </Link>
              <Link href="/plans" className="block font-semibold text-[#6f797a] hover:text-[#005259]">
                Plans
              </Link>
            </div>
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1d1b18]">In the app</p>
              <p className="text-[#6f797a] font-medium leading-relaxed text-xs">
                Dashboard, customers, actions, alerts, cashflow, collections, weekly review, and settings — all
                connected to the same ledger and risk engine.
              </p>
            </div>
          </div>
          <div className="text-[#6f797a] font-medium text-sm lg:text-right w-full lg:w-auto">
            © 2026 Crebitx Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
