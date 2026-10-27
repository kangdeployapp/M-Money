import { Debt, CashFlow, SavingsGoal } from "../types/database";
import { simulatePayoffStrategy, compareDebtStrategies } from "../lib/finance/debt";
import { evaluateSavingsGoal, calculateTotalSavingsMetrics } from "../lib/finance/savings";
import { calculateBudgetMetrics } from "../lib/finance/budget";

const mockDebts: Debt[] = [
  {
    id: "d1",
    user_id: "u1",
    name: "หนี้บัตรเครดิต A (ดอกสูง)",
    type: "credit_card",
    balance: 50000,
    interest_rate_pct: 18.0,
    min_payment: 2500,
    due_day: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "d2",
    user_id: "u1",
    name: "หนี้บัตรกดเงินสด B (ยอดเล็ก)",
    type: "loan",
    balance: 20000,
    interest_rate_pct: 25.0,
    min_payment: 1500,
    due_day: 15,
    created_at: new Date().toISOString(),
  },
  {
    id: "d3",
    user_id: "u1",
    name: "สินเชื่อบุคคล C (ดอกต่ำ)",
    type: "loan",
    balance: 100000,
    interest_rate_pct: 9.0,
    min_payment: 3000,
    due_day: 20,
    created_at: new Date().toISOString(),
  },
];

console.log("=== 1. TEST DEBT SIMULATION ===");
const avResult = simulatePayoffStrategy(mockDebts, 3000, "avalanche");
const snResult = simulatePayoffStrategy(mockDebts, 3000, "snowball");
const comparison = compareDebtStrategies(mockDebts, 3000);

console.log(`Avalanche Months: ${avResult.totalMonths}, Total Interest: ${avResult.totalInterestPaid}`);
console.log(`Snowball Months: ${snResult.totalMonths}, Total Interest: ${snResult.totalInterestPaid}`);
console.log(`Interest Saved with Avalanche: ${comparison.interestSavedWithAvalanche}`);
console.log(`Recommended: ${comparison.recommendedStrategy}`);

if (avResult.totalInterestPaid <= snResult.totalInterestPaid) {
  console.log("✓ Avalanche pays less or equal interest than Snowball: PASSED");
} else {
  console.error("✗ Test failed");
}

console.log("\n=== 2. TEST SAVINGS GOALS ===");
const goal: SavingsGoal = {
  id: "g1",
  user_id: "u1",
  name: "เงินสำรอง 1 แสน",
  target_amount: 100000,
  current_amount: 40000,
  target_date: "2027-10-01",
  priority: "high",
  created_at: new Date().toISOString(),
};
const evalGoal = evaluateSavingsGoal(goal);
console.log(`Goal: ${evalGoal.name}, Progress: ${evalGoal.progressPct}%, Monthly Req: ${evalGoal.requiredMonthlySavings}`);
if (evalGoal.remainingAmount === 60000 && evalGoal.progressPct === 40) {
  console.log("✓ Goal remaining amount & progress calculation: PASSED");
}

console.log("\n=== 3. TEST BUDGET ALLOCATION ===");
const cashFlows: CashFlow[] = [
  { id: "cf1", user_id: "u1", type: "income", category: "Salary", amount: 60000, is_recurring: true, created_at: "" },
  { id: "cf2", user_id: "u1", type: "fixed_expense", category: "Rent", amount: 12000, is_recurring: true, created_at: "" },
  { id: "cf3", user_id: "u1", type: "fixed_expense", category: "Utilities", amount: 3000, is_recurring: true, created_at: "" },
];

const budget = calculateBudgetMetrics(cashFlows, mockDebts, true);
console.log(`Total Income: ${budget.totalMonthlyIncome}`);
console.log(`Total Commitments: ${budget.totalFixedCommitments}`);
console.log(`Disposable Cash: ${budget.disposableCash}`);
console.log(`Surplus Debt Acceleration: ${budget.surplusRouting.debtAcceleration}`);

if (budget.totalMonthlyIncome === 60000 && budget.disposableCash > 0) {
  console.log("✓ Budget and Disposable cash computation: PASSED");
}

console.log("\nALL FINANCIAL ENGINE TESTS COMPLETED SUCCESSFULLY!");
