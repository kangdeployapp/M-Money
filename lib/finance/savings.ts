import { SavingsGoal } from "@/types/database";

export type GoalStatus = "completed" | "on_track" | "behind" | "attention_needed";

export interface GoalCalculationResult {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPct: number;
  remainingMonths: number;
  requiredMonthlySavings: number;
  status: GoalStatus;
  statusLabel: string;
  projectedCompletionDate: string;
}

export function calculateMonthsRemaining(targetDateStr: string): number {
  const now = new Date();
  const target = new Date(targetDateStr);

  const yearsDiff = target.getFullYear() - now.getFullYear();
  const monthsDiff = target.getMonth() - now.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;

  // If target day has passed or is this month, minimum 1 to avoid division by zero
  return Math.max(totalMonths, 1);
}

export function evaluateSavingsGoal(goal: SavingsGoal): GoalCalculationResult {
  const target = Number(goal.target_amount) || 0;
  const current = Number(goal.current_amount) || 0;
  const remaining = Math.max(0, target - current);
  const progressPct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
  const remainingMonths = calculateMonthsRemaining(goal.target_date);

  const requiredMonthlySavings =
    remaining > 0 && remainingMonths > 0
      ? Math.ceil(remaining / remainingMonths)
      : 0;

  let status: GoalStatus = "on_track";
  let statusLabel = "เป็นไปตามแผน";

  if (current >= target) {
    status = "completed";
    statusLabel = "สำเร็จแล้ว 🎉";
  } else {
    const targetDate = new Date(goal.target_date);
    const now = new Date();
    if (targetDate < now) {
      status = "attention_needed";
      statusLabel = "เลยกำหนดเป้าหมาย";
    } else {
      // Analyze pace
      const createdDate = goal.created_at ? new Date(goal.created_at) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const totalTimeSpan = Math.max(1, (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const elapsedTime = Math.max(0, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const expectedProgress = (elapsedTime / totalTimeSpan) * 100;

      if (progressPct >= expectedProgress * 0.9) {
        status = "on_track";
        statusLabel = "เป็นไปตามแผน";
      } else {
        status = "behind";
        statusLabel = "ล่าช้ากว่าเป้าหมาย";
      }
    }
  }

  return {
    goalId: goal.id,
    name: goal.name,
    targetAmount: target,
    currentAmount: current,
    remainingAmount: remaining,
    progressPct,
    remainingMonths,
    requiredMonthlySavings,
    status,
    statusLabel,
    projectedCompletionDate: goal.target_date,
  };
}

export function calculateTotalSavingsMetrics(goals: SavingsGoal[]) {
  const calculations = goals.map(evaluateSavingsGoal);
  const totalTarget = calculations.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = calculations.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalMonthlyRequired = calculations.reduce((sum, g) => sum + (g.status === "completed" ? 0 : g.requiredMonthlySavings), 0);
  const overallProgressPct = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;

  return {
    calculations,
    totalTarget,
    totalCurrent,
    totalMonthlyRequired,
    overallProgressPct,
    completedCount: calculations.filter((g) => g.status === "completed").length,
    activeCount: calculations.filter((g) => g.status !== "completed").length,
  };
}
