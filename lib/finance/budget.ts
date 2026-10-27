import { CashFlow, Debt } from "@/types/database";

export interface BudgetMetrics {
  totalMonthlyIncome: number;
  totalFixedExpenses: number;
  totalDebtMinPayments: number;
  totalFixedCommitments: number; // Fixed Expenses + Debt Minimums
  disposableCash: number; // Income - Fixed Commitments
  debtToIncomeRatioPct: number; // (Debt Min Payments / Income) * 100
  fixedCommitmentRatioPct: number; // (Fixed Commitments / Income) * 100
  
  // 50/30/20 Standard Baseline
  baseline503020: {
    needsIdeal: number; // 50%
    wantsIdeal: number; // 30%
    savingsDebtIdeal: number; // 20%
  };

  // Recommended Surplus Routing for Disposable Cash
  surplusRouting: {
    debtAcceleration: number; // Recommended extra toward debt payoff
    goalSavings: number; // Recommended toward savings goals
    emergencyBuffer: number; // Recommended for cash cushion
    flexibleDiscretionary: number; // Free spending
  };
}

export function calculateBudgetMetrics(
  cashFlows: CashFlow[],
  debts: Debt[],
  hasHighInterestDebt: boolean = false
): BudgetMetrics {
  const totalMonthlyIncome = cashFlows
    .filter((cf) => cf.type === "income")
    .reduce((sum, cf) => sum + Number(cf.amount || 0), 0);

  const totalFixedExpenses = cashFlows
    .filter((cf) => cf.type === "fixed_expense")
    .reduce((sum, cf) => sum + Number(cf.amount || 0), 0);

  const totalDebtMinPayments = debts
    .reduce((sum, d) => sum + Number(d.min_payment || 0), 0);

  const totalFixedCommitments = totalFixedExpenses + totalDebtMinPayments;
  const disposableCash = Math.max(0, totalMonthlyIncome - totalFixedCommitments);

  const debtToIncomeRatioPct =
    totalMonthlyIncome > 0
      ? Math.round((totalDebtMinPayments / totalMonthlyIncome) * 100)
      : 0;

  const fixedCommitmentRatioPct =
    totalMonthlyIncome > 0
      ? Math.round((totalFixedCommitments / totalMonthlyIncome) * 100)
      : 0;

  // 50/30/20 allocation
  const needsIdeal = Math.round(totalMonthlyIncome * 0.5);
  const wantsIdeal = Math.round(totalMonthlyIncome * 0.3);
  const savingsDebtIdeal = Math.round(totalMonthlyIncome * 0.2);

  // Dynamic Surplus Routing based on financial position:
  // If user has high interest debt (>10%), prioritize aggressive debt payoff
  let debtAcceleration = 0;
  let goalSavings = 0;
  let emergencyBuffer = 0;
  let flexibleDiscretionary = 0;

  if (disposableCash > 0) {
    if (hasHighInterestDebt) {
      debtAcceleration = Math.round(disposableCash * 0.6); // 60% aggressive payoff
      goalSavings = Math.round(disposableCash * 0.25); // 25% savings
      emergencyBuffer = Math.round(disposableCash * 0.1); // 10% buffer
      flexibleDiscretionary = Math.max(0, disposableCash - debtAcceleration - goalSavings - emergencyBuffer);
    } else if (debts.length > 0) {
      debtAcceleration = Math.round(disposableCash * 0.4);
      goalSavings = Math.round(disposableCash * 0.4);
      emergencyBuffer = Math.round(disposableCash * 0.1);
      flexibleDiscretionary = Math.max(0, disposableCash - debtAcceleration - goalSavings - emergencyBuffer);
    } else {
      // Debt free!
      debtAcceleration = 0;
      goalSavings = Math.round(disposableCash * 0.6);
      emergencyBuffer = Math.round(disposableCash * 0.2);
      flexibleDiscretionary = Math.max(0, disposableCash - goalSavings - emergencyBuffer);
    }
  }

  return {
    totalMonthlyIncome,
    totalFixedExpenses,
    totalDebtMinPayments,
    totalFixedCommitments,
    disposableCash,
    debtToIncomeRatioPct,
    fixedCommitmentRatioPct,
    baseline503020: {
      needsIdeal,
      wantsIdeal,
      savingsDebtIdeal,
    },
    surplusRouting: {
      debtAcceleration,
      goalSavings,
      emergencyBuffer,
      flexibleDiscretionary,
    },
  };
}
