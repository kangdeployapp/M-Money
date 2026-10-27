"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Target,
  ArrowRight,
  Zap,
  CheckCircle2,
  HelpCircle,
  Award,
} from "lucide-react";
import { useDataStore } from "@/components/DataStoreContext";
import { AiAdvisoryResponse } from "@/types/database";
import { formatTHB } from "@/lib/utils";

export default function AdvisorPage() {
  const { debts, goals, cashFlows, extraMonthlyPayment } = useDataStore();

  const [advice, setAdvice] = useState<AiAdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debts,
          goals,
          cashFlows,
          extraPayment: extraMonthlyPayment,
        }),
      });

      if (!res.ok) {
        throw new Error("ไม่สามารถประมวลผลคำแนะนำจาก AI ได้ในขณะนี้");
      }

      const data: AiAdvisoryResponse = await res.json();
      setAdvice(data);
    } catch (err: any) {
      console.error("AI error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAdvice();
  }, []);

  const score = advice?.financialHealthScore || 70;
  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-400";
    if (val >= 60) return "text-sky-400";
    if (val >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (val: number) => {
    if (val >= 80) return "from-emerald-500/20 to-teal-500/10 border-emerald-500/30";
    if (val >= 60) return "from-sky-500/20 to-blue-500/10 border-sky-500/30";
    if (val >= 40) return "from-amber-500/20 to-yellow-500/10 border-amber-500/30";
    return "from-rose-500/20 to-red-500/10 border-rose-500/30";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
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
                ที่ปรึกษาการเงินอัจฉริยะ (AI Financial Advisor)
              </h1>
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                CFP Level
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              วิเคราะห์สุขภาพการเงินเชิงลึก คำนวณความเสี่ยง และวางแผน Action Plan สดใหม่สำหรับคุณ
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdvice}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "กำลังวิเคราะห์ข้อมูล..." : "วิเคราะห์ใหม่ด้วย AI"}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Section: Health Score Meter & Recommended Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Meter Card */}
        <div
          className={`rounded-2xl border p-6 bg-gradient-to-br ${getScoreBg(
            score
          )} flex flex-col items-center justify-center text-center relative overflow-hidden`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            คะแนนสุขภาพทางการเงิน (Financial Health Score)
          </div>
          <div className="relative flex items-center justify-center my-2">
            <span className={`text-6xl font-black font-mono tracking-tight ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-xl font-bold text-slate-400 ml-1">/100</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-300">
            {score >= 80
              ? "ยอดเยี่ยม สภาพคล่องและวินัยอยู่ในเกณฑ์แข็งแกร่งมาก"
              : score >= 60
              ? "อยู่ในเกณฑ์ดี มีความพร้อมในการเร่งปลดหนี้และสะสมเงินออม"
              : score >= 40
              ? "ต้องระวังภาระหนี้สิน ควรคุมรายจ่ายคงที่และเพิ่มสภาพคล่อง"
              : "วิกฤตความเสี่ยงสูง ควรรีบปรับโครงสร้างหนี้ด่วน"}
          </div>
        </div>

        {/* Strategy Highlight Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ยุทธศาสตร์หลักที่ AI แนะนำ
              </span>
              <span className="rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400 border border-sky-500/20">
                Optimal Debt Strategy
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              {advice?.recommendedStrategy === "avalanche"
                ? "กลยุทธ์ Debt Avalanche (ทลายหนี้ดอกเบี้ยสูง)"
                : "กลยุทธ์ Debt Snowball (ลูกบอลหิมะสะสมชัยชนะ)"}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {advice?.recommendedStrategy === "avalanche"
                ? "จัดสรรเงินส่วนเกินเข้าโปะหนี้ที่มีอัตราดอกเบี้ยสูงที่สุดเป็นอันดับแรกในขณะที่คงการจ่ายขั้นต่ำสำหรับรายการอื่น เพื่อลดการสูญเสียดอกเบี้ยสะสมให้เหลือน้อยที่สุดตามหลักคณิตศาสตร์การเงิน"
                : "จัดสรรเงินส่วนเกินปิดหนี้ที่มีจำนวนเงินต้นน้อยที่สุดให้หมดไปทีละบัญชี เพื่อสร้างโมเมนตัมและกำลังใจทางการเงินก่อนจะนำเงินก้อนที่ปลดล็อคได้ไปเร่งก้อนถัดไป"}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>ประเมินตามมาตรฐาน Certified Financial Planner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-sky-400" />
              <span>คำนวณจากกระแสเงินสดจริงของคุณ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Urgent Action Items for This Month */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          3 แอ็กชันด่วนที่สุดสำหรับเดือนนี้ (Top 3 Urgent Financial Moves)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {advice?.urgentActionItems.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs shrink-0 mt-0.5 border border-sky-500/20">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
              </div>
              <div className="mt-3 flex items-center text-[11px] text-sky-400 font-medium">
                <span>ความสำคัญสูงสุด</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Action Plan Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-white mb-2">
          แผนการจัดสรรเงินส่วนเกินประจำเดือน (Monthly Action Plan)
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          เป้าหมายและเหตุผลในการนำเงินสดคงเหลือสุทธิไปกระจายต่อยอดเพื่อประโยชน์สูงสุด
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advice?.monthlyActionPlan.map((action, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-white">{action.targetName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      action.type === "debt"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {action.type === "debt" ? "โปะหนี้สิน" : "เงินออมสะสม"}
                  </span>
                </div>
                <div className="text-xl font-bold text-sky-400 font-mono mb-2">
                  {formatTHB(action.amountAllocated)}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  💡 {action.rationale}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Markdown Summary Analysis */}
      {advice?.summary && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white mb-4">
            บทวิเคราะห์สถานะเชิงลึกจาก AI
          </h2>
          <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
            {advice.summary}
          </div>
        </div>
      )}
    </div>
  );
}
