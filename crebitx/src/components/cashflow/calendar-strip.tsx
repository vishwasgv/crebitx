"use client"

import { useState } from "react"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getWeekDays(anchor: Date) {
  const day = anchor.getDay() // 0=Sun
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - day)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return {
      label: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      iso: d.toISOString().slice(0, 10),
    }
  })
}

export function CalendarStrip({ paymentsOnDate = {} }: { paymentsOnDate?: Record<string, "error" | "primary"> }) {
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const [selected, setSelected] = useState(todayIso)
  const [anchorDate, setAnchorDate] = useState(today)

  const days = getWeekDays(anchorDate)

  function prevWeek() {
    const d = new Date(anchorDate)
    d.setDate(d.getDate() - 7)
    setAnchorDate(d)
  }

  function nextWeek() {
    const d = new Date(anchorDate)
    d.setDate(d.getDate() + 7)
    setAnchorDate(d)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevWeek}
          className="w-9 h-9 rounded-full bg-white border border-[rgba(190,200,202,0.25)] shadow-ambient-card flex items-center justify-center text-[#6f797a] hover:text-[#005259] hover:border-[#005259]/30 transition-all text-sm font-bold"
          aria-label="Previous week"
        >
          ‹
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-[#6f797a]">
          {days[0].date} – {days[6].date}{" "}
          {new Date(days[0].year, days[0].month).toLocaleString("default", { month: "short" })}
          {days[0].month !== days[6].month
            ? ` / ${new Date(days[6].year, days[6].month).toLocaleString("default", { month: "short" })}`
            : ""}
        </span>
        <button
          onClick={nextWeek}
          className="w-9 h-9 rounded-full bg-white border border-[rgba(190,200,202,0.25)] shadow-ambient-card flex items-center justify-center text-[#6f797a] hover:text-[#005259] hover:border-[#005259]/30 transition-all text-sm font-bold"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
        {days.map((d) => {
          const isActive = d.iso === selected
          const isToday = d.iso === todayIso
          const dot = paymentsOnDate[d.iso]

          return (
            <button
              key={d.iso}
              onClick={() => setSelected(d.iso)}
              className={`flex-shrink-0 w-[calc((100%-72px)/7)] min-w-[3.5rem] h-28 rounded-[2rem] flex flex-col items-center justify-center space-y-1.5 relative transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005259]/40 ${
                isActive
                  ? "bg-[#005259] text-white shadow-ambient scale-105"
                  : isToday
                  ? "bg-[#cae8eb]/50 border-2 border-[#005259]/30 text-[#1d1b18]"
                  : "bg-white border border-[rgba(190,200,202,0.15)] shadow-ambient-card hover:bg-[#f9f3ed] hover:scale-[1.02] text-[#1d1b18]"
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-white/70" : "text-[#6f797a]"}`}>
                {d.label}
              </span>
              <span className="text-xl font-black leading-none">{d.date}</span>
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              {dot === "error" && !isActive && (
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white shadow-sm" />
              )}
              {dot === "primary" && !isActive && (
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#005259] rounded-full border-2 border-white shadow-sm" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
