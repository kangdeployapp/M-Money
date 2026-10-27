export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'other';
export type GoalPriority = 'high' | 'medium' | 'low';
export type CashFlowType = 'income' | 'fixed_expense' | 'variable_expense';
export type DebtStrategy = 'avalanche' | 'snowball';

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  type: DebtType;
  balance: number;
  interest_rate_pct: number;
  min_payment: number;
  due_day: number | null;
  created_at: string;
  updated_at?: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM-DD
  priority: GoalPriority;
  category?: string;
  created_at: string;
  updated_at?: string;
}

export interface CashFlow {
  id: string;
  user_id: string;
  type: CashFlowType;
  category: string;
  amount: number;
  is_recurring: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AiAdvisoryLog {
  id: string;
  user_id: string;
  snapshot_data: {
    totalDebt: number;
    totalSavings: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    disposableCash: number;
  };
  recommendations: AiAdvisoryResponse;
  created_at: string;
}

export interface AiActionPlanItem {
  targetName: string;
  type: 'debt' | 'savings';
  amountAllocated: number;
  rationale: string;
}

export interface AiAdvisoryResponse {
  financialHealthScore: number;
  summary: string;
  recommendedStrategy: DebtStrategy;
  monthlyActionPlan: AiActionPlanItem[];
  urgentActionItems: string[];
}
