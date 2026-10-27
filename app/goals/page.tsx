"use client";

import React, { useState } from "react";
import {
  Target,
  PlusCircle,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { useDataStore } from "@/components/DataStoreContext";
import { SavingsGoal, GoalPriority } from "@/types/database";
import { formatTHB, formatThaiDate } from "@/lib/utils";
import { evaluateSavingsGoal, calculateTotalSavingsMetrics } from "@/lib/finance/savings";

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useDataStore();

  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [category, setCategory] = useState("ความมั่นคง");

  const metrics = calculateTotalSavingsMetrics(goals);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    // Default 1 year from now
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    setTargetDate(oneYear.toISOString().split("T")[0]);
    setPriority("medium");
    setCategory("ความมั่นคง");
    setShowModal(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount));
    setTargetDate(goal.target_date);
    setPriority(goal.priority);
    setCategory(goal.category || "ความมั่นคง");
    setShowModal(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate,
        priority,
        category,
      });
    } else {
      addGoal({
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate,
        priority,
        category,
      });
    }
    setShowModal(false);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit || !depositAmount) return;
    const addVal = parseFloat(depositAmount);
    if (isNaN(addVal) || addVal <= 0) return;

    updateGoal(selectedGoalForDeposit.id, {
      current_amount: Number(selectedGoalForDeposit.current_amount) + addVal,
    });

    setDepositAmount("");
    setSelectedGoalForDeposit(null);
    setShowDepositModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Target className="h-7 w-7 text-sky-400" />
            เป้าหมายการออมเงิน (Goal-based Savings)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            วางแผนและคำนวณจำนวนเงินที่ต้องสะสมในแต่ละเดือนเพื่อให้บรรลุเป้าหมายตามกำหนดเวลา
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>สร้างเป้าหมายใหม่</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">เป้าหมายเงินออมทั้งหมด</span>
          <div className="text-2xl font-bold text-white mt-2">
            {formatTHB(metrics.totalTarget)}
          </div>
          <p className="text-xs text-slate-400 mt-1">{goals.length} เป้าหมาย</p>
        </div>

        {/* Current Savings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">สะสมได้แล้วตอนนี้</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {formatTHB(metrics.totalCurrent)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            คิดเป็น {metrics.overallProgressPct}% ของเป้าหมาย
          </p>
        </div>

        {/* Total Monthly Required */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">ต้องออมรวมต่อเดือน</span>
          <div className="text-2xl font-bold text-sky-400 mt-2">
            {formatTHB(metrics.totalMonthlyRequired)}
          </div>
          <p className="text-xs text-slate-400 mt-1">เพื่อพิชิตทุกเป้าหมายตามกำหนด</p>
        </div>

        {/* Completed Count */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs text-slate-400 font-medium">เป้าหมายที่พิชิตสำเร็จแล้ว</span>
          <div className="text-2xl font-bold text-indigo-400 mt-2">
            {metrics.completedCount} / {goals.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {metrics.activeCount} เป้าหมายกำลังสะสม
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const evalResult = evaluateSavingsGoal(goal);
          const isCompleted = evalResult.status === "completed";

          return (
            <div
              key={goal.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isCompleted
                  ? "border-emerald-500/30 bg-emerald-950/20"
                  : evalResult.status === "behind"
                  ? "border-amber-500/30 bg-slate-900/60"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div>
                {/* Card Top: Priority & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        goal.priority === "high"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : goal.priority === "medium"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      ความสำคัญ {goal.priority === "high" ? "สูง" : goal.priority === "medium" ? "ปานกลาง" : "ต่ำ"}
                    </span>
                    {goal.category && (
                      <span className="text-[11px] text-slate-400 px-2 py-0.5 bg-slate-800/80 rounded">
                        {goal.category}
                      </span>
                    )}
                  </div>

                  <span
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      isCompleted
                        ? "text-emerald-400"
                        : evalResult.status === "behind"
                        ? "text-amber-400"
                        : "text-sky-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : evalResult.status === "behind" ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {evalResult.statusLabel}
                  </span>
                </div>

                {/* Goal Title */}
                <h3 className="text-lg font-bold text-white mb-1">{goal.name}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  เป้าหมาย: {formatThaiDate(goal.target_date)} ({evalResult.remainingMonths} เดือนข้างหน้า)
                </p>

                {/* Balance & Target */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xs text-slate-400">สะสมแล้ว</span>
                    <p className="text-xl font-bold text-emerald-400">
                      {formatTHB(evalResult.currentAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">เป้าหมาย</span>
                    <p className="text-base font-semibold text-slate-300">
                      {formatTHB(evalResult.targetAmount)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCompleted
                        ? "bg-emerald-400"
                        : evalResult.status === "behind"
                        ? "bg-amber-400"
                        : "bg-sky-400"
                    }`}
                    style={{ width: `${evalResult.progressPct}%` }}
                  />
                </div>

                {/* Monthly Required Calculation Callout */}
                {!isCompleted && (
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">ต้องออมเพิ่มต่อเดือน:</span>
                      <span className="font-bold text-sky-400 text-sm">
                        {formatTHB(evalResult.requiredMonthlySavings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>ยังขาดอีก:</span>
                      <span>{formatTHB(evalResult.remainingAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    setSelectedGoalForDeposit(goal);
                    setDepositAmount("");
                    setShowDepositModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>บันทึกเงินออม</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-800"
                    title="แก้ไขเป้าหมาย"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`ต้องการลบเป้าหมาย ${goal.name} ใช่หรือไม่?`)) {
                        deleteGoal(goal.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                    title="ลบเป้าหมาย"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingGoal ? "แก้ไขเป้าหมายการออม" : "สร้างเป้าหมายการออมใหม่"}
            </h3>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ชื่อเป้าหมาย</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เงินดาวน์บ้าน, เงินสำรองฉุกเฉิน, ทริปยุโรป"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">จำนวนเงินเป้าหมาย (บาท)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1000"
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">เงินสะสมปัจจุบัน (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">วันเป้าหมายที่ต้องการสำเร็จ</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">ความสำคัญ</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as GoalPriority)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="high">สูง (จำเป็นมาก)</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="low">ต่ำ (ถ้ามีโอกาส)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">หมวดหมู่</label>
                <input
                  type="text"
                  placeholder="เช่น ความมั่นคง, ท่องเที่ยว, เกษียณ, ซื้อของ"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  บันทึกเป้าหมาย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {showDepositModal && selectedGoalForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-1">
              บันทึกเงินออมเพิ่ม
            </h3>
            <p className="text-xs text-slate-400 mb-4 truncate">
              เป้าหมาย: <span className="text-sky-400 font-medium">{selectedGoalForDeposit.name}</span>
            </p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">จำนวนเงินที่ต้องการออมเพิ่ม (บาท)</label>
                <input
                  type="number"
                  required
                  autoFocus
                  min="1"
                  step="100"
                  placeholder="เช่น 2,000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none font-mono text-lg"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  เพิ่มเงินออม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
