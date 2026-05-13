"use client"

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Week 1", amount: 350000 },
  { name: "Week 2", amount: 650000 },
  { name: "Week 3", amount: 450000 },
  { name: "Week 4", amount: 900000 },
]

export function CollectionChart() {
  return (
    <div className="h-64 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: "#6f797a", fontWeight: "bold" }} 
            dy={10} 
          />
          <Tooltip 
            cursor={{ fill: "rgba(0,82,89,0.05)" }}
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 40px -10px rgba(0,82,89,0.15)", fontWeight: "bold", color: "#1d1b18" }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Collected"]}
          />
          <Bar dataKey="amount" fill="#005259" radius={[8, 8, 8, 8]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
