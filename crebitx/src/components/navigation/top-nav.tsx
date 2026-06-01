"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, Settings, LayoutDashboard, Users, Sparkles, TrendingUp, Wallet, Calendar, LogOut } from "lucide-react"
import { CrebitXLogo } from "@/components/brand/crebitx-logo"
import authService from "@/lib/auth-service"

export function TopNav({ user, alertsCount = 0 }: { user: any, alertsCount?: number }) {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Actions", href: "/actions", icon: Sparkles },
    { name: "Alerts", href: "/alerts", icon: Bell, badge: alertsCount },
    { name: "Cashflow", href: "/cashflow", icon: Wallet },
    { name: "Collections", href: "/collections", icon: TrendingUp },
    { name: "Weekly", href: "/weekly", icon: Calendar },
  ]

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-[rgba(190,200,202,0.2)] shadow-ambient flex flex-col w-full bg-[#fef8f3]/80 backdrop-blur-md">
      <div className="flex justify-between items-center px-6 py-4">
        <Link href="/dashboard" className="group flex items-center gap-3 cursor-pointer">
          <CrebitXLogo variant="mark" />
          <div>
            <h1 className="font-extrabold text-[#1d1b18] text-xl leading-tight tracking-tight group-hover:text-[#005259] transition-colors">
              CrebitX
            </h1>
            <p className="text-[10px] text-[#6f797a] font-bold uppercase tracking-widest">
              {pathname.split("/")[1] || "Dashboard"}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/alerts"
            title="Open alerts"
            aria-label="Open alerts"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f3ede8]"
          >
            <Bell size={20} className="text-[#3f494a]" />
            {alertsCount > 0 && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#ba1a1a]" />
            )}
          </Link>
          <Link
            href="/settings"
            title="Settings"
            aria-label="Open settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f3ede8]"
          >
            <Settings size={20} className="text-[#3f494a]" />
          </Link>
          <button
            type="button"
            title="Logout"
            aria-label="Logout"
            onClick={() => {
              authService.logout()
              signOut({ callbackUrl: "/login" })
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#ffdad6]/60"
          >
            <LogOut size={19} className="text-[#ba1a1a]" />
          </button>
        </div>
      </div>
      
      <nav className="flex items-center px-6 gap-6 pb-3 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`text-sm font-bold pb-1 whitespace-nowrap transition-all border-b-2 ${
                isActive 
                  ? "text-[#005259] border-[#005259] font-black" 
                  : "text-[#6f797a] border-transparent hover:text-[#005259]"
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
