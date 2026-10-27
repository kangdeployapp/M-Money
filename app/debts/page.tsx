"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  PlusCircle,
  Trash2,
  Edit2,
  Calendar,
  Percent,
  CheckCircle,
  Sparkles,
  Zap,
  Info,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDataStore } from "@/components/DataStoreContext";
import { Debt, DebtStrategy, DebtType } from "@/types/database";
import { formatTHB, formatPercent } from "@/lib/utils";
import { compareDebtStrategies, simulatePayoffStrategy } from "@/lib/finance/debt";

export default function DebtsPage() {
  const { debts, extraMonthlyPayment, setExtraMonthlyPayment, addDebt, updateDebt, deleteDebt } =
    useDataStore();

  const [selectedStrategy, setSelectedStrategy] = useState<DebtStrategy>("avalanche");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("credit_card");
  const [balance, setBalance] = useState("");
  const [interestRatePct, setInterestRatePct] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [dueDay, setDueDay] = useState("1");

  // Run simulation & comparison
  const comparison = useMemo(() => {
    return compareDebtStrategies(debts, extraMonthlyPayment);
  }, [debts, extraMonthlyPayment]);

  const activeSimulation =
    selectedStrategy === "avalanche" ? comparison.avalanche : comparison.snowball;

  // Chart dataset
  const chartData = useMemo(() => {
    const avalancheSched = comparison.avalanche.monthlySchedule;
    const snowballSched = comparison.snowball.monthlySchedule;
    const maxMonths = Math.max(avalancheSched.length, snowballSched.length);

    const data = [];
    // sample months to keep chart responsive if schedule is long
    const step = maxMonths > 36 ? Math.ceil(maxMonths / 30) : 1;

    for (let i = 0; i < maxMonths; i += step) {
      const avItem = avalancheSched[i] || avalancheSched[avalancheSched.length - 1];
      const snItem = snowballSched[i] || snowballSched[snowballSched.length - 1];

      data.push({
        month: `เดือนที่ ${i + 1}`,
        date: avItem ? avItem.date : "",
        ยอดหนี้Avalanche: avItem ? avItem.totalRemainingBalance : 0,
        ยอดหนี้Snowball: snItem ? snItem.totalRemainingBalance : 0,
      });
    }

    // Add final month 0 balance
    if (data.length > 0) {
      data.push({
        month: "ปลอดหนี้",
        date: "สิ้นสุด",
        ยอดหนี้Avalanche: 0,
        ยอดหนี้Snowball: 0,
      });
    }

    return data;
  }, [comparison]);

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setName("");
    setType("credit_card");
    setBalance("");
    setInterestRatePct("");
    setMinPayment("");
    setDueDay("1");
    setShowAddModal(true);
  };

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setType(debt.type);
    setBalance(String(debt.balance));
    setInterestRatePct(String(debt.interest_rate_pct));
    setMinPayment(String(debt.min_payment));
    setDueDay(String(debt.due_day || 1));
    setShowAddModal(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name,
        type,
        balance: parseFloat(balance),
        interest_rate_pct: parseFloat(interestRatePct) || 0,
        min_payment: parseFloat(minPayment) || 0,
        due_day: parseInt(dueDay) || 1,
      });
    } else {
      addDebt({
        name,
        type,
        balance: parseFloat(balance),
        interest_rate_pct: parseFloat(interestRatePct) || 0,
        min_payment: parseFloat(minPayment) || 0,
        due_day: parseInt(dueDay) || 1,
      });
    }

    setShowAddModal(false);
  };

  const totalBalance = debts.reduce((s, d) => s + Number(d.balance || 0), 0);
  const totalMinPayment = debts.reduce((s, d) => s + Number(d.min_payment || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TrendingDown className="h-7 w-7 text-rose-400" />
            ยุทธศาสตร์จำลองการปลดหนี้
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            เปรียบเทียบยุทธศาสตร์ Avalanche (ประหยัดดอกเบี้ยสูงสุด) กับ Snowball (ชนะทางจิตวิทยาเร็วสุด)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>เพิ่มรายการหนี้สิน</span>
        </button>
      </div>

      {/* Strategy Recommendation Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-sky-950/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                ข้อเสนอแนะกลยุทธ์ที่เหมาะสมที่สุด
              </span>
              <p className="text-base font-semibold text-white mt-0.5">
                {comparison.recommendedStrategy === "avalanche"
                  ? "แนะนำ Debt Avalanche (ดอกเบี้ยสูงสุดก่อน)"
                  : "แนะนำ Debt Snowball (ยอดหนี้เล็กสุดก่อน)"}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {comparison.recommendationReason}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedStrategy("avalanche")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStrategy === "avalanche"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Avalanche (ลดดอกเบี้ย)
            </button>
            <button
              onClick={() => setSelectedStrategy("snowball")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStrategy === "snowball"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Snowball (กำลังใจเร็ว)
            </button>
          </div>
        </div>
      </div>

      {/* Extra Monthly Payment Slider Control */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              เงินโปะหนี้เพิ่มรายเดือน (Extra Monthly Accelerator)
            </label>
            <p className="text-xs text-slate-400 mt-0.5">
              ยิ่งใส่เงินส่วนเกินเข้าไป ยิ่งตัดเงินต้นได้เร็วและลดดอกเบี้ยสะสมได้ทวีคูณ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="500"
              value={extraMonthlyPayment}
              onChange={(e) => setExtraMonthlyPayment(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-right font-mono text-base font-bold text-sky-400 focus:border-sky-500 focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-medium">บาท/เดือน</span>
          </div>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min="0"
          max="30000"
          step="500"
          value={extraMonthlyPayment}
          onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
          className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-slate-500 mt-2">
          <span>0 บาท</span>
          <span>10,000 บาท</span>
          <span>20,000 บาท</span>
          <span>30,000 บาท</span>
        </div>
      </div>

      {/* Simulator Metrics Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date to be debt-free */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">กำหนดวันปลอดหนี้ทั้งหมด</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {activeSimulation.debtFreeDate || "-"}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            อีกประมาณ {activeSimulation.totalMonths} เดือน
          </p>
        </div>

        {/* Total Interest Paid */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">ดอกเบี้ยรวมที่ต้องจ่าย</span>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {formatTHB(activeSimulation.totalInterestPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ตลอดระยะเวลาสัญญา
          </p>
        </div>

        {/* Interest Difference Saved */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">Avalanche ประหยัดกว่า</span>
          <div className="text-2xl font-bold text-sky-400 mt-2">
            {formatTHB(Math.max(0, comparison.interestSavedWithAvalanche))}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            เมื่อเทียบกับวิธี Snowball
          </p>
        </div>

        {/* Total Principal Paid */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">ยอดเงินต้นรวม</span>
          <div className="text-2xl font-bold text-white mt-2">
            {formatTHB(totalBalance)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ขั้นต่ำรวม {formatTHB(totalMinPayment)}/ด.
          </p>
        </div>
      </div>

      {/* Payoff Simulation Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              กราฟจำลองการทยอยลดลงของหนี้ (Amortization Schedule)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              เปรียบเทียบวิถียอดหนี้คงเหลือระหว่าง Avalanche (เส้นสีฟ้า) กับ Snowball (เส้นสีส้ม)
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAvalanche" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSnowball" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [formatTHB(Number(val)), ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Area
                type="monotone"
                dataKey="ยอดหนี้Avalanche"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAvalanche)"
              />
              <Area
                type="monotone"
                dataKey="ยอดหนี้Snowball"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSnowball)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payoff Order Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          ลำดับการปลดหนี้สำเร็จ (Payoff Milestones) ตามวิธี {selectedStrategy === "avalanche" ? "Avalanche" : "Snowball"}
        </h2>
        {activeSimulation.payoffOrder.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeSimulation.payoffOrder.map((item, idx) => (
              <div
                key={item.debtId}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  #{idx + 1}
                </div>
                <span className="text-xs text-slate-400">หมดในเดือนที่ {item.monthPaidOff}</span>
                <p className="text-sm font-bold text-white mt-1 truncate">{item.debtName}</p>
                <span className="inline-block mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                  ปลดล็อคยอดขั้นต่ำคืนกลับกระเป๋า 🎉
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">ไม่มีหนี้ค้างชำระ</p>
        )}
      </div>

      {/* Debts List Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          รายการหนี้สินทั้งหมด ({debts.length} รายการ)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs font-semibold text-slate-400">
              <tr>
                <th className="pb-3">ชื่อรายการหนี้</th>
                <th className="pb-3">ประเภท</th>
                <th className="pb-3 text-right">ยอดคงค้าง</th>
                <th className="pb-3 text-right">ดอกเบี้ย (% ต่อปี)</th>
                <th className="pb-3 text-right">ชำระขั้นต่ำ</th>
                <th className="pb-3 text-center">วันครบกำหนด</th>
                <th className="pb-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {debts.map((debt) => (
                <tr key={debt.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-medium text-white">{debt.name}</td>
                  <td className="py-3.5 text-xs text-slate-400">
                    <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700">
                      {debt.type === "credit_card"
                        ? "บัตรเครดิต"
                        : debt.type === "loan"
                        ? "สินเชื่อ"
                        : debt.type === "mortgage"
                        ? "บ้าน/อสังหาฯ"
                        : "ทั่วไป"}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-semibold text-white">
                    {formatTHB(debt.balance)}
                  </td>
                  <td className="py-3.5 text-right text-rose-400 font-medium">
                    {formatPercent(debt.interest_rate_pct)}
                  </td>
                  <td className="py-3.5 text-right text-slate-300">
                    {formatTHB(debt.min_payment)}
                  </td>
                  <td className="py-3.5 text-center text-xs text-slate-400">
                    วันที่ {debt.due_day || "-"}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(debt)}
                        className="p-1 text-slate-400 hover:text-sky-400 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`ต้องการลบรายการ ${debt.name} ใช่หรือไม่?`)) {
                            deleteDebt(debt.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Debt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingDebt ? "แก้ไขรายการหนี้สิน" : "เพิ่มรายการหนี้สิน"}
            </h3>
            <form onSubmit={handleSaveDebt} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ชื่อหนี้สิน / สถาบันการเงิน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บัตรเครดิต KBank, สินเชื่อรถยนต์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ประเภท</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DebtType)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="credit_card">บัตรเครดิต</option>
                    <option value="loan">สินเชื่อบุคคล / กดยืม</option>
                    <option value="mortgage">สินเชื่อบ้าน / คอนโด</option>
                    <option value="other">หนี้สินอื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ยอดคงค้าง (บาท)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    placeholder="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ดอกเบี้ย (% ต่อปี)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    step="0.1"
                    placeholder="16.0"
                    value={interestRatePct}
                    onChange={(e) => setInterestRatePct(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ชำระขั้นต่ำ (บาท/เดือน)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    placeholder="1000"
                    value={minPayment}
                    onChange={(e) => setMinPayment(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">วันที่ครบกำหนดชำระของทุกเดือน (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
