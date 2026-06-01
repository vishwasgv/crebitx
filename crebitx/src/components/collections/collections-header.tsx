"use client"

import { useState } from "react"
import Link from "next/link"
import { PieChart } from "lucide-react"

const PERIODS = ["7D", "30D", "90D", "ALL"] as const
type Period = typeof PERIODS[number]

export function CollectionsHeader() {
  const [activePeriod, setActivePeriod] = useState<Period>("30D")

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
      <div className="space-y-3">
        <h2 className="text-4xl md:text-6xl font-extrabold text-[#1d1b18] tracking-tight leading-[1.05]">
          Recovery <br />Efficiency
        </h2>
      </div>
      <div className="flex bg-white rounded-2xl p-2 shadow-ambient-card border border-[rgba(190,200,202,0.15)]">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activePeriod === period
                ? "bg-[#005259] text-white shadow-ambient"
                : "text-[#6f797a] hover:bg-[#f3ede8]"
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewRulesButton() {
  return (
    <Link
      href="/settings"
      className="mt-8 inline-block px-6 py-3 bg-white text-[#005259] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#f9f3ed] transition-all"
    >
      Review Rules
    </Link>
  )
}
