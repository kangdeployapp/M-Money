import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Debt, SavingsGoal, CashFlow, DebtStrategy } from "@/types/database";
import { compareDebtStrategies } from "@/lib/finance/debt";
import { calculateBudgetMetrics } from "@/lib/finance/budget";
import { calculateTotalSavingsMetrics } from "@/lib/finance/savings";

const advisorOutputSchema = z.object({
  financialHealthScore: z
    .number()
    .min(1)
    .max(100)
    .describe("คะแนนสุขภาพทางการเงิน 1-100"),
  summary: z
    .string()
    .describe("สรุปสถานการณ์ทางการเงิน ภาพรวม และข้อเสนอแนะเชิงยุทธศาสตร์แบบ Markdown ภาษาไทย"),
  recommendedStrategy: z
    .enum(["avalanche", "snowball"])
    .describe("กลยุทธ์การปลดหนี้ที่เหมาะสมที่สุด ('avalanche' หรือ 'snowball')"),
  monthlyActionPlan: z
    .array(
      z.object({
        targetName: z.string().describe("ชื่อเป้าหมายหรือชื่อหนี้"),
        type: z.enum(["debt", "savings"]).describe("ประเภท: debt หรือ savings"),
        amountAllocated: z.number().describe("จำนวนเงินที่จัดสรรในเดือนนี้ (บาท)"),
        rationale: z.string().describe("เหตุผลในการจัดสรรเงินก้อนนี้"),
      })
    )
    .describe("แผนการจัดสรรเงินส่วนเกินประจำเดือน"),
  urgentActionItems: z
    .array(z.string())
    .length(3)
    .describe("3 สิ่งสำคัญที่สุดที่ต้องทำในเดือนนี้เพื่อเพิ่มความมั่งคั่ง"),
});

export async function POST(req: NextRequest) {
  try {
    let body: {
      debts?: Debt[];
      goals?: SavingsGoal[];
      cashFlows?: CashFlow[];
      extraPayment?: number;
    } = {};

    try {
      body = await req.json();
    } catch {
      // Body empty
    }

    let debts: Debt[] = body.debts || [];
    let goals: SavingsGoal[] = body.goals || [];
    let cashFlows: CashFlow[] = body.cashFlows || [];
    const extraPayment = body.extraPayment || 0;

    // Check Supabase authentication & fetch user records if not provided in body
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && debts.length === 0) {
        const [debtsRes, goalsRes, cfRes] = await Promise.all([
          supabase.from("debts").select("*").eq("user_id", user.id),
          supabase.from("savings_goals").select("*").eq("user_id", user.id),
          supabase.from("cash_flows").select("*").eq("user_id", user.id),
        ]);

        if (debtsRes.data && debtsRes.data.length > 0) debts = debtsRes.data as Debt[];
        if (goalsRes.data && goalsRes.data.length > 0) goals = goalsRes.data as SavingsGoal[];
        if (cfRes.data && cfRes.data.length > 0) cashFlows = cfRes.data as CashFlow[];
      }
    } catch {
      // Offline or local demo mode
    }

    // Run deterministic financial calculations
    const debtAnalysis = compareDebtStrategies(debts, extraPayment);
    const hasHighInterest = debts.some((d) => Number(d.interest_rate_pct) >= 15);
    const budgetMetrics = calculateBudgetMetrics(cashFlows, debts, hasHighInterest);
    const savingsMetrics = calculateTotalSavingsMetrics(goals);

    const totalDebtBalance = debts.reduce((s, d) => s + Number(d.balance || 0), 0);
    const totalCurrentSavings = savingsMetrics.totalCurrent;

    // Build context prompt
    const promptContext = `
คุณคือ "WealthPilot AI" ที่ปรึกษาทางการเงินส่วนบุคคลชั้นนำระดับ Certified Financial Planner (CFP)
ภารกิจ: วิเคราะห์สุขภาพการเงินของลูกค้า และสร้างแผนปฏิบัติการ (Action Plan) ที่เป็นรูปธรรม เฉียบคม ชัดเจน และนำไปปฏิบัติได้จริงในเดือนนี้
ภาษาที่ใช้: ภาษาไทยที่สุภาพ เข้าใจง่าย มีพลังใจ และเน้นความแม่นยำทางการเงิน

ข้อมูลสถานะการเงินของลูกค้า:
1. รายรับ-รายจ่าย:
   - รายได้ต่อเดือน: ${budgetMetrics.totalMonthlyIncome.toLocaleString()} บาท
   - รายจ่ายคงที่ประจำเดือน: ${budgetMetrics.totalFixedExpenses.toLocaleString()} บาท
   - ภาระชำระหนี้ขั้นต่ำต่อเดือน: ${budgetMetrics.totalDebtMinPayments.toLocaleString()} บาท
   - รวมภาระผูกพันคงที่ (Fixed Commitments): ${budgetMetrics.totalFixedCommitments.toLocaleString()} บาท (${budgetMetrics.fixedCommitmentRatioPct}% ของรายได้)
   - กระแสเงินสดคงเหลือสุทธิ (Disposable Cash): ${budgetMetrics.disposableCash.toLocaleString()} บาท/เดือน
   - สัดส่วนหนี้ต่อรายได้ (DTI Ratio): ${budgetMetrics.debtToIncomeRatioPct}%

2. หนี้สินรวม (${totalDebtBalance.toLocaleString()} บาท):
${debts.length > 0 ? debts.map((d) => `   - ${d.name} (${d.type}): ยอดคงค้าง ${Number(d.balance).toLocaleString()} บาท, ดอกเบี้ย ${d.interest_rate_pct}% ต่อปี, ขั้นต่ำ ${Number(d.min_payment).toLocaleString()} บาท`).join("\n") : "   - ไม่มีหนี้สินค้างชำระ (ยอดเยี่ยมมาก)"}

ผลวิเคราะห์เปรียบเทียบกลยุทธ์ปลดหนี้:
- Avalanche (ดอกเบี้ยสูงสุดก่อน): จบใน ${debtAnalysis.avalanche.totalMonths} เดือน, ดอกเบี้ยรวม ${debtAnalysis.avalanche.totalInterestPaid.toLocaleString()} บาท
- Snowball (ยอดเล็กสุดก่อน): จบใน ${debtAnalysis.snowball.totalMonths} เดือน, ดอกเบี้ยรวม ${debtAnalysis.snowball.totalInterestPaid.toLocaleString()} บาท
- ส่วนต่างดอกเบี้ยที่ประหยัดได้: ${debtAnalysis.interestSavedWithAvalanche.toLocaleString()} บาท

3. เป้าหมายการออมเงิน (เป้าหมายรวม ${savingsMetrics.totalTarget.toLocaleString()} บาท, สะสมแล้ว ${totalCurrentSavings.toLocaleString()} บาท - คิดเป็น ${savingsMetrics.overallProgressPct}%):
${goals.length > 0 ? goals.map((g) => `   - ${g.name}: เป้า ${Number(g.target_amount).toLocaleString()} บาท, ปัจจุบัน ${Number(g.current_amount).toLocaleString()} บาท, วันเป้าหมาย ${g.target_date}, ลำดับความสำคัญ: ${g.priority}`).join("\n") : "   - ยังไม่ได้ตั้งเป้าหมายการออม"}

คำสั่งเฉพาะ:
1. ประเมิน Financial Health Score (1-100) โดยพิจารณาจาก DTI, สภาพคล่องสำรองฉุกเฉิน, อัตราดอกเบี้ยหนี้สิน และวินัยการออม
2. แนะนำ recommendedStrategy ('avalanche' หรือ 'snowball')
3. จัดสรรเงินสดคงเหลือสุทธิ (${budgetMetrics.disposableCash.toLocaleString()} บาท) ลงใน monthlyActionPlan อย่างสมเหตุสมผล
4. ระบุ urgentActionItems 3 ข้อเด็ดขาดสำหรับเดือนนี้
`;

    // Attempt AI Generation via Vercel AI SDK
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const openaiKey = process.env.OPENAI_API_KEY;

    if (googleKey) {
      try {
        const googleProvider = createGoogleGenerativeAI({ apiKey: googleKey });
        const result = await generateObject({
          model: googleProvider(geminiModel),
          schema: advisorOutputSchema,
          prompt: promptContext,
        });
        return NextResponse.json(result.object);
      } catch (err) {
        console.warn(`Gemini (${geminiModel}) generation failed, trying OpenAI or deterministic fallback`, err);
      }
    }

    if (openaiKey) {
      try {
        const result = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: advisorOutputSchema,
          prompt: promptContext,
        });
        return NextResponse.json(result.object);
      } catch (err) {
        console.warn("OpenAI generation failed, using fallback engine", err);
      }
    }

    // 100% Robust Deterministic Fallback Engine
    // (Used when API keys are not provided or remote API times out)
    const fallbackResponse = generateDeterministicAdvice({
      debts,
      goals,
      budgetMetrics,
      debtAnalysis,
      savingsMetrics,
      totalDebtBalance,
      totalCurrentSavings,
    });

    return NextResponse.json(fallbackResponse);
  } catch (error: any) {
    console.error("Advisor API error:", error);
    return NextResponse.json(
      { error: "Internal Advisor Error", message: error.message },
      { status: 500 }
    );
  }
}

function generateDeterministicAdvice({
  debts,
  goals,
  budgetMetrics,
  debtAnalysis,
  savingsMetrics,
  totalDebtBalance,
  totalCurrentSavings,
}: any) {
  // Score calculation
  let score = 70;
  if (budgetMetrics.debtToIncomeRatioPct > 40) score -= 25;
  else if (budgetMetrics.debtToIncomeRatioPct > 20) score -= 10;
  else if (budgetMetrics.debtToIncomeRatioPct === 0) score += 15;

  if (budgetMetrics.disposableCash <= 0) score -= 20;
  else if (budgetMetrics.disposableCash > 15000) score += 10;

  if (totalCurrentSavings > 50000) score += 10;
  score = Math.max(10, Math.min(95, score));

  const recommendedStrategy: DebtStrategy = debtAnalysis.recommendedStrategy;

  // Build monthly action plan
  const actionPlan = [];
  const surplus = budgetMetrics.disposableCash;

  if (surplus > 0) {
    if (debts.length > 0) {
      const topDebt = debts.slice().sort((a: Debt, b: Debt) =>
        recommendedStrategy === "avalanche"
          ? b.interest_rate_pct - a.interest_rate_pct
          : a.balance - b.balance
      )[0];

      const debtPayAmount = Math.round(surplus * 0.6);
      actionPlan.push({
        targetName: topDebt.name,
        type: "debt" as const,
        amountAllocated: debtPayAmount,
        rationale: `เร่งโปะเงินส่วนเกินเข้าหนี้ก้อนนี้ตามยุทธศาสตร์ ${recommendedStrategy === "avalanche" ? "Avalanche (ดอกเบี้ยสูงสุด)" : "Snowball (ปิดหนี้ก้อนเล็ก)"} เพื่อตัดต้นและลดภาระดอกเบี้ยเร็วที่สุด`,
      });

      const savingsAmount = surplus - debtPayAmount;
      const topGoal = goals[0] || { name: "เงินสำรองฉุกเฉินสภาพคล่อง" };
      actionPlan.push({
        targetName: topGoal.name,
        type: "savings" as const,
        amountAllocated: savingsAmount,
        rationale: "แบ่งเงิน 40% ของเงินสดคงเหลือเพื่อสร้างสภาพคล่องสำรอง ป้องกันการสร้างหนี้ซ้ำซ้อนในอนาคต",
      });
    } else {
      actionPlan.push({
        targetName: goals[0]?.name || "กองทุนสร้างความมั่งคั่ง",
        type: "savings" as const,
        amountAllocated: Math.round(surplus * 0.8),
        rationale: "จัดสรรเงินออมส่วนใหญ่เข้าเป้าหมายหลัก เนื่องจากไม่มีภาระหนี้สินค้างชำระ",
      });
      actionPlan.push({
        targetName: "สภาพคล่องฉุกเฉิน / เงินสำรองรายเดือน",
        type: "savings" as const,
        amountAllocated: Math.round(surplus * 0.2),
        rationale: "สะสมเงินสดสภาพคล่องสูงในบัญชีเงินฝากดิจิทัลดอกเบี้ยสูง",
      });
    }
  }

  const urgentActionItems = [
    debts.length > 0
      ? `หยุดการก่อหนี้บริโภคใหม่ทันที และจ่ายเงินขั้นต่ำให้ตรงเวลาทุกบัญชีเพื่อรักษาประวัติเครดิตบูโร`
      : `ตั้งเป้าหมายเงินสำรองฉุกเฉินให้ครอบคลุมรายจ่ายอย่างน้อย 6 เดือนในบัญชีดอกเบี้ยสูง`,
    budgetMetrics.disposableCash > 0
      ? `โอนเงินส่วนเกิน ${Math.round(budgetMetrics.disposableCash * 0.6).toLocaleString()} บาท เข้าโปะ ${debts[0]?.name || "เป้าหมายการออม"} ทันทีในวันเงินเดือนออก (Pay Yourself First)`
      : `ทบทวนรายจ่ายคงที่และค่าบริการสมาชิกรายเดือน เพื่อดึงกระแสเงินสดกลับมาเป็นบวก`,
    `ตรวจสอบสิทธิ์ลดหย่อนภาษี เช่น ประกันชีวิต, กองทุนสำรองเลี้ยงชีพ หรือ RMF/SSF เพื่อเพิ่มเงินคืนภาษี`,
  ];

  const summary = `
### สรุปภาพรวมสุขภาพทางการเงิน (WealthPilot Financial Health)

- **สถานะสภาพคล่อง:** คุณมีกระแสเงินสดคงเหลือสุทธิ **${budgetMetrics.disposableCash.toLocaleString()} บาท/เดือน** อัตราส่วนภาระหนี้ต่อรายได้ (DTI) อยู่ที่ **${budgetMetrics.debtToIncomeRatioPct}%**
- **ยุทธศาสตร์หนี้สินที่แนะนำ:** แนะนำใช้กลยุทธ์ **${recommendedStrategy === "avalanche" ? "Debt Avalanche (หนี้ดอกเบี้ยสูงก่อน)" : "Debt Snowball (หนี้ก้อนเล็กก่อน)"}**
- **มูลค่าหนี้สินรวม:** ${totalDebtBalance.toLocaleString()} บาท
- **เงินออมสะสมปัจจุบัน:** ${totalCurrentSavings.toLocaleString()} บาท

> 💡 **ข้อเสนอแนะเชิงยุทธศาสตร์:** ด้วยการจัดสรรเงินส่วนเกินเข้าโปะหนี้อย่างเป็นระบบตามแผนด้านล่าง คุณจะสามารถประหยัดดอกเบี้ยได้กว่า **${debtAnalysis.interestSavedWithAvalanche.toLocaleString()} บาท** และปลดหนี้ได้เร็วขึ้นอย่างมีนัยสำคัญ
`;

  return {
    financialHealthScore: score,
    summary,
    recommendedStrategy,
    monthlyActionPlan: actionPlan,
    urgentActionItems,
  };
}
