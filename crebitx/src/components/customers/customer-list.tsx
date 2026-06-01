"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
  Check,
} from "lucide-react"
import { Scroll3D } from "@/components/ui/scroll-3d"

type RiskFilter = "ALL" | "GREEN" | "YELLOW" | "RED"
type SortOption = "name" | "outstanding_desc" | "outstanding_asc"

const RISK_OPTIONS: { value: RiskFilter; label: string; color: string }[] = [
  { value: "ALL", label: "All", color: "" },
  { value: "GREEN", label: "Green", color: "text-[#005259]" },
  { value: "YELLOW", label: "Yellow", color: "text-[#703d15]" },
  { value: "RED", label: "Red", color: "text-[#ba1a1a]" },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "outstanding_desc", label: "Highest outstanding" },
  { value: "outstanding_asc", label: "Lowest outstanding" },
  { value: "name", label: "Name A–Z" },
]

export function CustomerList({ customers }: { customers: any[] }) {
  const [query, setQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL")
  const [sort, setSort] = useState<SortOption>("outstanding_desc")
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = [...(customers || [])]

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.riskSnapshots?.[0]?.level?.toLowerCase().includes(q),
      )
    }

    if (riskFilter !== "ALL") {
      list = list.filter((c) => c.riskSnapshots?.[0]?.level === riskFilter)
    }

    list.sort((a, b) => {
      const aOut = (a.receivables || []).reduce(
        (s: number, r: any) => s + (r.amount - r.paidAmount),
        0,
      )
      const bOut = (b.receivables || []).reduce(
        (s: number, r: any) => s + (r.amount - r.paidAmount),
        0,
      )
      if (sort === "outstanding_desc") return bOut - aOut
      if (sort === "outstanding_asc") return aOut - bOut
      return a.name.localeCompare(b.name)
    })

    return list
  }, [customers, query, riskFilter, sort])

  const activeFilters = (riskFilter !== "ALL" ? 1 : 0) + (sort !== "outstanding_desc" ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Search + Filter bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bec8ca] group-focus-within:text-[#005259] transition-colors"
            size={20}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, or risk status..."
            className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white border border-[rgba(190,200,202,0.2)] shadow-ambient-card focus:ring-2 focus:ring-[#005259]/10 focus:border-[#005259]/20 transition-all outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bec8ca] hover:text-[#ba1a1a] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`h-16 px-6 rounded-2xl border shadow-ambient-card font-bold text-sm flex items-center gap-2 hover:bg-[#f3ede8] transition-all whitespace-nowrap relative ${
            showFilters || activeFilters > 0
              ? "bg-[#cae8eb] border-[#005259]/30 text-[#005259]"
              : "bg-white border-[rgba(190,200,202,0.2)] text-[#1d1b18]"
          }`}
        >
          <Filter size={18} />
          Advanced Filters
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#005259] text-white text-[10px] font-black flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-[rgba(190,200,202,0.2)] shadow-ambient-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6f797a]">Risk Level</p>
              <div className="flex gap-2 flex-wrap">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRiskFilter(opt.value)}
                    className={`h-9 px-4 rounded-full text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${
                      riskFilter === opt.value
                        ? "bg-[#005259] text-white border-[#005259]"
                        : "bg-white border-[rgba(190,200,202,0.3)] text-[#6f797a] hover:border-[#005259]/30"
                    }`}
                  >
                    {riskFilter === opt.value && <Check size={10} strokeWidth={3} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6f797a]">Sort By</p>
              <div className="flex gap-2 flex-wrap">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`h-9 px-4 rounded-full text-xs font-black border transition-all flex items-center gap-1.5 ${
                      sort === opt.value
                        ? "bg-[#005259] text-white border-[#005259]"
                        : "bg-white border-[rgba(190,200,202,0.3)] text-[#6f797a] hover:border-[#005259]/30"
                    }`}
                  >
                    {sort === opt.value && <Check size={10} strokeWidth={3} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={() => { setRiskFilter("ALL"); setSort("outstanding_desc") }}
              className="text-xs font-bold text-[#ba1a1a] hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {query || riskFilter !== "ALL" ? (
        <p className="text-xs font-bold text-[#6f797a] uppercase tracking-widest px-1">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      ) : null}

      {/* Customer cards */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#6f797a] font-medium">
            No customers match your search.
          </div>
        ) : (
          filtered.map((customer: any, i: number) => {
            const latestRisk = customer.riskSnapshots?.[0]
            const isCritical = latestRisk?.level === "RED"
            const outstanding = (customer.receivables || []).reduce(
              (sum: number, r: any) => sum + (r.amount - r.paidAmount),
              0,
            )

            return (
              <Scroll3D key={customer.id} delay={i * 60}>
                <Link href={`/customers/${customer.id}`}>
                  <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-ambient-card border border-[rgba(190,200,202,0.15)] hover:border-[#005259]/30 transition-all group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                          isCritical ? "bg-[#ffdad6] text-[#ba1a1a]" : "bg-[#f3ede8] text-[#3f494a]"
                        }`}
                      >
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
                        <div
                          className={`flex items-center gap-1.5 justify-end text-xs font-black uppercase ${
                            latestRisk?.level === "RED"
                              ? "text-[#ba1a1a]"
                              : latestRisk?.level === "YELLOW"
                              ? "text-[#703d15]"
                              : "text-[#005259]"
                          }`}
                        >
                          {latestRisk?.level === "GREEN" && <ShieldCheck size={14} />}
                          {latestRisk?.level || "N/A"}
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <ChevronRight
                          size={24}
                          className="text-[#bec8ca] group-hover:text-[#005259] group-hover:translate-x-1 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </Scroll3D>
            )
          })
        )}
      </div>
    </div>
  )
}
