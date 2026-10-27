"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingDown,
  Target,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useDataStore } from "./DataStoreContext";

const navItems = [
  { href: "/dashboard", label: "ภาพรวมการเงิน", icon: LayoutDashboard },
  { href: "/debts", label: "ยุทธศาสตร์ปลดหนี้", icon: TrendingDown },
  { href: "/goals", label: "เป้าหมายการออม", icon: Target },
  { href: "/advisor", label: "ที่ปรึกษา AI", icon: Sparkles, badge: "AI" },
];

export function Navbar() {
  const pathname = usePathname();
  const { resetToDemo } = useDataStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090d16]">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">
                Wealth<span className="text-sky-400">Pilot</span>
              </span>
              <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ระบบบริหารการเงิน & ที่ปรึกษา AI
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-sky-400 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase shadow-sm">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("ต้องการรีเซ็ตข้อมูลตัวอย่างกลับสู่ค่าเริ่มต้นใช่หรือไม่?")) {
                resetToDemo();
              }
            }}
            title="รีเซ็ตข้อมูลตัวอย่าง"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">รีเซ็ตข้อมูล</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#090d16] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-slate-800 text-sky-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (PWA Experience) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-slate-800 bg-[#090d16]/95 backdrop-blur-lg px-2 py-1.5 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
                isActive ? "text-sky-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
