import { Debt, DebtStrategy } from "@/types/database";

export interface MonthlyDebtSnapshot {
  month: number;
  date: string; // "YYYY-MM"
  totalRemainingBalance: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  debtBalances: { [debtId: string]: number };
  debtsPaidOffThisMonth: string[];
}

export interface PayoffStrategyResult {
  strategy: DebtStrategy;
  totalMonths: number;
  debtFreeDate: string; // "YYYY-MM"
  totalInterestPaid: number;
  totalAmountPaid: number;
  monthlySchedule: MonthlyDebtSnapshot[];
  payoffOrder: { debtId: string; debtName: string; monthPaidOff: number }[];
}

export interface DebtComparisonResult {
  avalanche: PayoffStrategyResult;
  snowball: PayoffStrategyResult;
  interestSavedWithAvalanche: number;
  monthsDifference: number; // positive means avalanche is faster
  recommendedStrategy: DebtStrategy;
  recommendationReason: string;
}

interface WorkingDebt {
  id: string;
  name: string;
  balance: number;
  interestRatePct: number;
  minPayment: number;
  monthlyRate: number;
  isPaidOff: boolean;
}

function addMonthsToCurrent(monthsToAdd: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthsToAdd, 1);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function simulatePayoffStrategy(
  debts: Debt[],
  extraMonthlyPayment: number = 0,
  strategy: DebtStrategy = "avalanche"
): PayoffStrategyResult {
  // Filter active debts with balance > 0
  const activeDebts: WorkingDebt[] = debts
    .filter((d) => Number(d.balance) > 0)
    .map((d) => ({
      id: d.id,
      name: d.name,
      balance: Number(d.balance),
      interestRatePct: Number(d.interest_rate_pct),
      minPayment: Number(d.min_payment),
      monthlyRate: Number(d.interest_rate_pct) / 100 / 12,
      isPaidOff: false,
    }));

  if (activeDebts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      debtFreeDate: addMonthsToCurrent(0),
      totalInterestPaid: 0,
      totalAmountPaid: 0,
      monthlySchedule: [],
      payoffOrder: [],
    };
  }

  // Sort according to strategy
  const sortDebts = () => {
    if (strategy === "avalanche") {
      // Highest interest rate first; if equal, smallest balance
      activeDebts.sort((a, b) => {
        if (b.interestRatePct !== a.interestRatePct) {
          return b.interestRatePct - a.interestRatePct;
        }
        return a.balance - b.balance;
      });
    } else {
      // Smallest balance first (Snowball)
      activeDebts.sort((a, b) => a.balance - b.balance);
    }
  };

  sortDebts();

  const monthlySchedule: MonthlyDebtSnapshot[] = [];
  const payoffOrder: { debtId: string; debtName: string; monthPaidOff: number }[] = [];
  let totalCumulativeInterest = 0;
  let totalCumulativePaid = 0;
  let currentMonth = 0;
  const MAX_MONTHS = 360; // 30-year safety cutoff to avoid infinite loops

  // Continue until all debts are paid off or max reached
  while (activeDebts.some((d) => d.balance > 0.01) && currentMonth < MAX_MONTHS) {
    currentMonth++;
    let monthInterest = 0;
    let monthPrincipal = 0;
    const paidOffThisMonth: string[] = [];

    // Step 1: Accrue interest for the month
    for (const debt of activeDebts) {
      if (debt.balance > 0.01) {
        const accrued = debt.balance * debt.monthlyRate;
        debt.balance += accrued;
        monthInterest += accrued;
        totalCumulativeInterest += accrued;
      }
    }

    // Step 2: Pay minimum payments across all active debts
    let freedMinPaymentThisMonth = 0;
    for (const debt of activeDebts) {
      if (debt.balance > 0.01) {
        const payment = Math.min(debt.balance, Math.max(debt.minPayment, 0));
        debt.balance -= payment;
        monthPrincipal += payment;
        totalCumulativePaid += payment;

        if (debt.balance <= 0.01) {
          debt.balance = 0;
          debt.isPaidOff = true;
          paidOffThisMonth.push(debt.name);
          payoffOrder.push({ debtId: debt.id, debtName: debt.name, monthPaidOff: currentMonth });
          freedMinPaymentThisMonth += debt.minPayment;
        }
      }
    }

    // Step 3: Allocate extra money + rolled over payments to target debt
    // Calculate total extra pool available this month
    // In both avalanche and snowball, paid-off minimums roll forward
    let availableExtra = Number(extraMonthlyPayment) + freedMinPaymentThisMonth;

    // Target the first debt with remaining balance according to current strategy order
    // Ensure sorted again if balances shifted (especially for snowball)
    if (strategy === "snowball") {
      activeDebts.sort((a, b) => {
        if (a.balance === 0) return 1;
        if (b.balance === 0) return -1;
        return a.balance - b.balance;
      });
    }

    for (const debt of activeDebts) {
      if (availableExtra <= 0.01) break;
      if (debt.balance > 0.01) {
        const extraToApply = Math.min(debt.balance, availableExtra);
        debt.balance -= extraToApply;
        monthPrincipal += extraToApply;
        totalCumulativePaid += extraToApply;
        availableExtra -= extraToApply;

        if (debt.balance <= 0.01 && !debt.isPaidOff) {
          debt.balance = 0;
          debt.isPaidOff = true;
          if (!paidOffThisMonth.includes(debt.name)) {
            paidOffThisMonth.push(debt.name);
            payoffOrder.push({ debtId: debt.id, debtName: debt.name, monthPaidOff: currentMonth });
          }
        }
      }
    }

    // Build snapshot for this month
    const totalRemaining = activeDebts.reduce((sum, d) => sum + d.balance, 0);
    const debtBalances: { [key: string]: number } = {};
    activeDebts.forEach((d) => {
      debtBalances[d.id] = Math.round(d.balance * 100) / 100;
    });

    monthlySchedule.push({
      month: currentMonth,
      date: addMonthsToCurrent(currentMonth),
      totalRemainingBalance: Math.round(totalRemaining * 100) / 100,
      totalInterestPaid: Math.round(monthInterest * 100) / 100,
      totalPrincipalPaid: Math.round(monthPrincipal * 100) / 100,
      debtBalances,
      debtsPaidOffThisMonth: paidOffThisMonth,
    });
  }

  return {
    strategy,
    totalMonths: currentMonth,
    debtFreeDate: addMonthsToCurrent(currentMonth),
    totalInterestPaid: Math.round(totalCumulativeInterest * 100) / 100,
    totalAmountPaid: Math.round(totalCumulativePaid * 100) / 100,
    monthlySchedule,
    payoffOrder,
  };
}

export function compareDebtStrategies(
  debts: Debt[],
  extraMonthlyPayment: number = 0
): DebtComparisonResult {
  const avalanche = simulatePayoffStrategy(debts, extraMonthlyPayment, "avalanche");
  const snowball = simulatePayoffStrategy(debts, extraMonthlyPayment, "snowball");

  const interestSaved = Math.round((snowball.totalInterestPaid - avalanche.totalInterestPaid) * 100) / 100;
  const monthsDiff = snowball.totalMonths - avalanche.totalMonths;

  let recommendedStrategy: DebtStrategy = "avalanche";
  let recommendationReason = "";

  if (interestSaved > 1000) {
    recommendedStrategy = "avalanche";
    recommendationReason = `วิธี Avalanche ช่วยประหยัดดอกเบี้ยได้มากกว่า ${interestSaved.toLocaleString()} บาท และปลดหนี้ได้เร็วที่สุดทางคณิตศาสตร์`;
  } else {
    // If interest saved is minimal, snowball gives better psychological wins
    recommendedStrategy = "snowball";
    recommendationReason = `วิธี Snowball เหมาะกับคุณมากกว่า เพราะช่วยปิดหนี้ก้อนเล็กได้รวดเร็ว สร้างกำลังใจและความต่อเนื่องทางการเงิน`;
  }

  return {
    avalanche,
    snowball,
    interestSavedWithAvalanche: interestSaved,
    monthsDifference: monthsDiff,
    recommendedStrategy,
    recommendationReason,
  };
}
