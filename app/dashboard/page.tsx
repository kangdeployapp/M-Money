"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingDown,
  TrendingUp,
  Target,
  Sparkles,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Trash2,
  DollarSign,
} from "lucide-react";
import { useDataStore } from "@/components/DataStoreContext";
import { formatTHB, formatPercent } from "@/lib/utils";
import { calculateBudgetMetrics } from "@/lib/finance/budget";
import { calculateTotalSavingsMetrics } from "@/lib/finance/savings";

export default function DashboardPage() {
  const { debts, goals, cashFlows, addCashFlow, deleteCashFlow } = useDataStore();

  const [showAddCfModal, setShowAddCfModal] = useState(false);
  const [cfType, setCfType] = useState<"income" | "fixed_expense">("income");
  const [cfCategory, setCfCategory] = useState("");
  const [cfAmount, setCfAmount] = useState("");

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance || 0), 0);
  const savingsMetrics = calculateTotalSavingsMetrics(goals);
  const totalSavings = savingsMetrics.totalCurrent;
  const netWorth = totalSavings - totalDebt;

  const hasHighInterest = debts.some((d) => Number(d.interest_rate_pct) >= 15);
  const budget = calculateBudgetMetrics(cashFlows, debts, hasHighInterest);

  const handleCreateCashFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfCategory || !cfAmount) return;
    addCashFlow({
      category: cfCategory,
      type: cfType,
      amount: parseFloat(cfAmount),
      is_recurring: true,
    });
    setCfCategory("");
    setCfAmount("");
    setShowAddCfModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Quick Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-sky-500/30 shadow-xl shadow-sky-500/10 bg-[#090d16]">
            <Image
              src="/icons/icon-192x192.png"
              alt="WealthPilot Navigator"
              width={56}
              height={56}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                ภาพรวมการเงินส่วนบุคคล
              </h1>
              <span className="text-[11px] font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full hidden sm:inline-block">
                Built for Kang
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              สรุปสถานะความมั่งคั่ง หนี้สิน และกระแสเงินสดสภาพคล่องแบบเรียลไทม์
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all"
          >
            <Sparkles className="h-4 w-4 text-sky-200" />
            <span>ปรึกษา AI ประเมินสุขภาพเงิน</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance / Net Worth */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ความมั่งคั่งสุทธิ (Net Worth)</span>
            <div className={`p-2 rounded-xl ${netWorth >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-bold ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatTHB(netWorth)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              (เงินออมสะสม - หนี้สินรวมคงค้าง)
            </p>
          </div>
        </div>

        {/* Total Debt */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">หนี้สินรวมคงค้าง</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatTHB(totalDebt)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-slate-400">{debts.length} รายการ</span>
              <Link href="/debts" className="text-rose-400 hover:underline flex items-center gap-0.5">
                วางแผนโปะ <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Total Savings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">เงินออมสะสมตามเป้าหมาย</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatTHB(totalSavings)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-sky-400 font-medium">คืบหน้า {savingsMetrics.overallProgressPct}%</span>
              <Link href="/goals" className="text-sky-400 hover:underline flex items-center gap-0.5">
                ดูเป้าหมาย <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Disposable Cash */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">เงินสดคงเหลือสุทธิ / เดือน</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {formatTHB(budget.disposableCash)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              หลังหักค่าใช้จ่ายคงที่ & ขั้นต่ำหนี้
            </p>
          </div>
        </div>
      </div>

      {/* Cash Flow Allocation & 50/30/20 Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow & Surplus Allocation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Distribution Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-white">การจัดสรรกระแสเงินสดรายเดือน</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  วิเคราะห์สัดส่วนรายรับ รายจ่ายคงที่ และเงินเหลือไปต่อยอด
                </p>
              </div>
              <button
                onClick={() => setShowAddCfModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5 text-sky-400" />
                <span>เพิ่มรายการ</span>
              </button>
            </div>

            {/* Income & Commitment Summary Bar */}
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 font-medium">รายได้รวมประจำเดือน</span>
                  <p className="text-lg font-bold text-emerald-300 mt-1">
                    {formatTHB(budget.totalMonthlyIncome)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-xs text-rose-400 font-medium">รวมภาระผูกพันคงที่</span>
                  <p className="text-lg font-bold text-rose-300 mt-1">
                    {formatTHB(budget.totalFixedCommitments)}
                  </p>
                  <span className="text-[10px] text-slate-400">({budget.fixedCommitmentRatioPct}% ของรายได้)</span>
                </div>
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <span className="text-xs text-sky-400 font-medium">เงินสดเหลือจัดสรร (Surplus)</span>
                  <p className="text-lg font-bold text-sky-300 mt-1">
                    {formatTHB(budget.disposableCash)}
                  </p>
                </div>
              </div>

              {/* Visual Proportion Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span>สัดส่วนค่าใช้จ่ายคงที่ vs เงินสดคงเหลือ</span>
                  <span>{formatPercent(budget.fixedCommitmentRatioPct)} / {formatPercent(100 - budget.fixedCommitmentRatioPct)}</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, budget.fixedCommitmentRatioPct)}%` }}
                    title="ภาระผูกพันคงที่"
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - budget.fixedCommitmentRatioPct)}%` }}
                    title="เงินสดคงเหลือสุทธิ"
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span>ภาระคงที่ (รายจ่าย + ขั้นต่ำหนี้)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>เงินสดคงเหลือต่อยอด</span>
                  </div>
                </div>
              </div>

              {/* Recommended Surplus Routing */}
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-sky-400" />
                  สูตรจัดสรรเงินสดคงเหลืออัตโนมัติ ({formatTHB(budget.disposableCash)})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">เร่งโปะหนี้เร็ว</span>
                    <p className="text-sm font-bold text-rose-400 mt-1">
                      {formatTHB(budget.surplusRouting.debtAcceleration)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">เงินออมตามเป้า</span>
                    <p className="text-sm font-bold text-sky-400 mt-1">
                      {formatTHB(budget.surplusRouting.goalSavings)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">สำรองฉุกเฉิน</span>
                    <p className="text-sm font-bold text-amber-400 mt-1">
                      {formatTHB(budget.surplusRouting.emergencyBuffer)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">ใช้จ่ายอิสระ</span>
                    <p className="text-sm font-bold text-emerald-400 mt-1">
                      {formatTHB(budget.surplusRouting.flexibleDiscretionary)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Items List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-base font-semibold text-white mb-4">
              รายการกระแสเงินสดรายเดือน
            </h3>
            <div className="divide-y divide-slate-800/80">
              {cashFlows.map((cf) => (
                <div key={cf.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        cf.type === "income"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {cf.type === "income" ? "+" : "-"}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-200">{cf.category}</span>
                      <p className="text-[11px] text-slate-400">
                        {cf.type === "income" ? "รายได้ประจำ" : "รายจ่ายคงที่"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${
                        cf.type === "income" ? "text-emerald-400" : "text-slate-300"
                      }`}
                    >
                      {cf.type === "income" ? "+" : "-"}
                      {formatTHB(cf.amount)}
                    </span>
                    <button
                      onClick={() => deleteCashFlow(cf.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="ลบรายการ"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: 50/30/20 Rule & Quick Actions */}
        <div className="space-y-6">
          {/* 50/30/20 Baseline Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-sky-400" />
              <h3 className="text-base font-semibold text-white">
                เกณฑ์มาตรฐาน 50/30/20
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              สัดส่วนมาตรฐานทางการเงินสากล เทียบกับรายได้รายเดือนของคุณ:
            </p>

            <div className="space-y-4">
              {/* Needs 50% */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">50% สิ่งจำเป็น (Needs)</span>
                  <span className="font-semibold text-sky-400">
                    {formatTHB(budget.baseline503020.needsIdeal)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ค่าที่พัก, อาหาร, ค่าน้ำไฟ, เดินทาง
                </p>
              </div>

              {/* Wants 30% */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">30% สิ่งที่ต้องการ (Wants)</span>
                  <span className="font-semibold text-amber-400">
                    {formatTHB(budget.baseline503020.wantsIdeal)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  สังสรรค์, ช้อปปิ้ง, กิจกรรมหย่อนใจ
                </p>
              </div>

              {/* Savings & Debt 20% */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">20% ออมเงินและปลดหนี้</span>
                  <span className="font-semibold text-emerald-400">
                    {formatTHB(budget.baseline503020.savingsDebtIdeal)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  เงินสำรองฉุกเฉิน, ลงทุน, โปะหนี้เกินขั้นต่ำ
                </p>
              </div>
            </div>

            {/* Quick Health Callout */}
            <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 flex gap-3 items-start">
              <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-medium text-white mb-0.5">เคล็ดลับการจัดสรร</p>
                หากยังมีหนี้ดอกเบี้ยสูงกว่า 10% แนะนำโยกงบ Wants มาโปะหนี้ก่อนเพื่อหยุดการสูญเสียดอกเบี้ยสะสม
              </div>
            </div>
          </div>

          {/* Shortcut Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/debts"
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <TrendingDown className="h-5 w-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-semibold text-white block">เครื่องคำนวณหนี้</span>
                <span className="text-[11px] text-slate-400">Avalanche vs Snowball</span>
              </div>
            </Link>

            <Link
              href="/goals"
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <Target className="h-5 w-5 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-semibold text-white block">เป้าหมายการออม</span>
                <span className="text-[11px] text-slate-400">คำนวณเงินออมต่อเดือน</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Add Cash Flow Modal */}
      {showAddCfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              เพิ่มรายการกระแสเงินสด
            </h3>
            <form onSubmit={handleCreateCashFlow} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ประเภทรายการ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCfType("income")}
                    className={`py-2 rounded-lg text-xs font-medium border ${
                      cfType === "income"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    รายรับ (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfType("fixed_expense")}
                    className={`py-2 rounded-lg text-xs font-medium border ${
                      cfType === "fixed_expense"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    รายจ่ายคงที่ (Fixed Expense)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">ชื่อหมวดหมู่ / แหล่งที่มา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าเช่าห้อง, งานเสริม, เงินเดือน"
                  value={cfCategory}
                  onChange={(e) => setCfCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">จำนวนเงิน (บาท/เดือน)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="0"
                  value={cfAmount}
                  onChange={(e) => setCfAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCfModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
