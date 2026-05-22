import type { LucideIcon } from "lucide-react"
import { Globe, Zap, Users } from "lucide-react"

export type PricingPlan = {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  icon: LucideIcon
  popular?: boolean
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "₹0",
    description: "For small shops getting started.",
    features: [
      "Up to 50 customers",
      "Manual reminders",
      "Basic dashboard",
      "Single business",
    ],
    icon: Globe,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "Automate your collections.",
    features: [
      "Unlimited customers",
      "WhatsApp automation",
      "Advanced risk scoring",
      "Priority support",
    ],
    icon: Zap,
    popular: true,
  },
  {
    name: "Team",
    price: "₹999",
    period: "/month",
    description: "For larger distribution businesses.",
    features: [
      "Multiple staff access",
      "Custom industry presets",
      "Tally/Excel export",
      "API access",
    ],
    icon: Users,
  },
]
