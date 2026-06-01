import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { pricingPlans } from "@/lib/pricing"
import { CrebitXLogo } from "@/components/brand/crebitx-logo"

export default async function PlansPage() {
  const session = await auth()
  const backHref = session ? "/dashboard" : "/"
  const heading = session ? "Upgrade your account" : "Pricing"

  return (
    <div className="min-h-screen bg-[#fef8f3] pb-24">
      <header className="sticky top-0 z-40 border-b border-[rgba(190,200,202,0.3)] bg-[#fef8f3]/96 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#f3ede8]">
                <ArrowLeft size={20} className="text-[#005259]" />
              </Button>
            </Link>
            <h1 className="font-bold text-xl text-[#1d1b18] tracking-tight">{heading}</h1>
          </div>
          <CrebitXLogo variant="wordmark" href={backHref} className="hidden sm:block h-8" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-7 pt-12 sm:pt-16">
        <div className="text-center space-y-4 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#005259]">Plans</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1d1b18] tracking-tight">
            Choose the right plan for your business
          </h2>
          <p className="text-[#6f797a] font-medium text-lg max-w-2xl mx-auto">
            Same pricing whether you&apos;re exploring or already using CrebitX. Start free and upgrade when
            your team is ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-3xl bg-white shadow-ambient-card border transition-all ${
                plan.popular
                  ? "border-[#005259] ring-2 ring-[#005259]/15 md:scale-[1.02]"
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
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium text-[#3f494a]">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#cae8eb] flex items-center justify-center shrink-0 text-[#005259]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              {session ? (
                <Button
                  className={`mt-auto w-full h-12 rounded-full font-bold ${
                    plan.popular
                      ? "bg-[#005259] hover:bg-[#0f6c74]"
                      : "bg-[#1d1b18] hover:bg-[#32302d]"
                  }`}
                >
                  {plan.price === "₹0" ? "Current plan" : "Upgrade"}
                </Button>
              ) : (
                <Link
                  href="/register"
                  className={`mt-auto inline-flex w-full h-12 items-center justify-center rounded-full font-bold text-white transition-colors ${
                    plan.popular
                      ? "bg-[#005259] hover:bg-[#0f6c74]"
                      : "bg-[#1d1b18] hover:bg-[#32302d]"
                  }`}
                >
                  {plan.price === "₹0" ? "Start free" : "Get started"}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-[#cae8eb]/30 rounded-3xl p-10 sm:p-12 text-center space-y-5 border border-[#cae8eb]/40">
          <h3 className="text-2xl font-bold text-[#1d1b18]">Need a custom plan for multiple entities?</h3>
          <p className="text-[#6f797a] font-medium max-w-2xl mx-auto">
            For large distributor networks or multi-branch operations, we can tailor CrebitX to your workflow.
          </p>
          <a
            href="mailto:support@crebitx.com"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#005259] px-8 text-sm font-bold text-[#005259] transition-colors hover:bg-[#005259]/5"
          >
            Contact us
          </a>
        </div>
      </main>
    </div>
  )
}
