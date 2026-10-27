"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Debt, SavingsGoal, CashFlow } from "@/types/database";
import {
  INITIAL_DEMO_DEBTS,
  INITIAL_DEMO_GOALS,
  INITIAL_DEMO_CASHFLOWS,
} from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";

interface DataStoreContextType {
  debts: Debt[];
  goals: SavingsGoal[];
  cashFlows: CashFlow[];
  extraMonthlyPayment: number;
  setExtraMonthlyPayment: (amount: number) => void;
  addDebt: (debt: Omit<Debt, "id" | "user_id" | "created_at">) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addGoal: (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at">) => void;
  updateGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addCashFlow: (cf: Omit<CashFlow, "id" | "user_id" | "created_at">) => void;
  deleteCashFlow: (id: string) => void;
  resetToDemo: () => void;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(3000);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Load from local storage or demo defaults
    try {
      const storedDebts = localStorage.getItem("wp_debts");
      const storedGoals = localStorage.getItem("wp_goals");
      const storedCashFlows = localStorage.getItem("wp_cashflows");
      const storedExtra = localStorage.getItem("wp_extra_payment");

      if (storedDebts) setDebts(JSON.parse(storedDebts));
      else setDebts(INITIAL_DEMO_DEBTS);

      if (storedGoals) setGoals(JSON.parse(storedGoals));
      else setGoals(INITIAL_DEMO_GOALS);

      if (storedCashFlows) setCashFlows(JSON.parse(storedCashFlows));
      else setCashFlows(INITIAL_DEMO_CASHFLOWS);

      if (storedExtra) setExtraMonthlyPayment(Number(storedExtra) || 3000);

      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      setIsSupabaseConfigured(hasUrl);
    } catch {
      setDebts(INITIAL_DEMO_DEBTS);
      setGoals(INITIAL_DEMO_GOALS);
      setCashFlows(INITIAL_DEMO_CASHFLOWS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("wp_debts", JSON.stringify(debts));
      } catch {}
    }
  }, [debts, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("wp_goals", JSON.stringify(goals));
      } catch {}
    }
  }, [goals, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("wp_cashflows", JSON.stringify(cashFlows));
      } catch {}
    }
  }, [cashFlows, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("wp_extra_payment", String(extraMonthlyPayment));
      } catch {}
    }
  }, [extraMonthlyPayment, isLoading]);

  const addDebt = (debt: Omit<Debt, "id" | "user_id" | "created_at">) => {
    const newDebt: Debt = {
      ...debt,
      id: "debt-" + Date.now(),
      user_id: "demo-user",
      created_at: new Date().toISOString(),
    };
    setDebts((prev) => [newDebt, ...prev]);
  };

  const updateDebt = (id: string, updated: Partial<Debt>) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const addGoal = (goal: Omit<SavingsGoal, "id" | "user_id" | "created_at">) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: "goal-" + Date.now(),
      user_id: "demo-user",
      created_at: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
  };

  const updateGoal = (id: string, updated: Partial<SavingsGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addCashFlow = (cf: Omit<CashFlow, "id" | "user_id" | "created_at">) => {
    const newCf: CashFlow = {
      ...cf,
      id: "cf-" + Date.now(),
      user_id: "demo-user",
      created_at: new Date().toISOString(),
    };
    setCashFlows((prev) => [newCf, ...prev]);
  };

  const deleteCashFlow = (id: string) => {
    setCashFlows((prev) => prev.filter((cf) => cf.id !== id));
  };

  const resetToDemo = () => {
    setDebts(INITIAL_DEMO_DEBTS);
    setGoals(INITIAL_DEMO_GOALS);
    setCashFlows(INITIAL_DEMO_CASHFLOWS);
    setExtraMonthlyPayment(3000);
    localStorage.removeItem("wp_debts");
    localStorage.removeItem("wp_goals");
    localStorage.removeItem("wp_cashflows");
    localStorage.removeItem("wp_extra_payment");
  };

  return (
    <DataStoreContext.Provider
      value={{
        debts,
        goals,
        cashFlows,
        extraMonthlyPayment,
        setExtraMonthlyPayment,
        addDebt,
        updateDebt,
        deleteDebt,
        addGoal,
        updateGoal,
        deleteGoal,
        addCashFlow,
        deleteCashFlow,
        resetToDemo,
        isLoading,
        isSupabaseConfigured,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error("useDataStore must be used within DataStoreProvider");
  }
  return context;
}
