-- ========================================================
-- WealthPilot Supabase Database Schema Migration
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    currency VARCHAR(10) DEFAULT 'THB' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. DEBTS TABLE
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit_card', 'loan', 'mortgage', 'other')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    interest_rate_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (interest_rate_pct >= 0),
    min_payment NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (min_payment >= 0),
    due_day INT CHECK (due_day BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (target_amount >= 0),
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. CASH FLOWS TABLE
CREATE TABLE IF NOT EXISTS public.cash_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('income', 'fixed_expense', 'variable_expense')),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. AI ADVISORY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_advisory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_advisory_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Debts Policies
CREATE POLICY "Users can view their own debts"
    ON public.debts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
    ON public.debts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
    ON public.debts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
    ON public.debts FOR DELETE
    USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can view their own savings goals"
    ON public.savings_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals"
    ON public.savings_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
    ON public.savings_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
    ON public.savings_goals FOR DELETE
    USING (auth.uid() = user_id);

-- Cash Flows Policies
CREATE POLICY "Users can view their own cash flows"
    ON public.cash_flows FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash flows"
    ON public.cash_flows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash flows"
    ON public.cash_flows FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash flows"
    ON public.cash_flows FOR DELETE
    USING (auth.uid() = user_id);

-- AI Advisory Logs Policies
CREATE POLICY "Users can view their own advisory logs"
    ON public.ai_advisory_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own advisory logs"
    ON public.ai_advisory_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own advisory logs"
    ON public.ai_advisory_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ========================================================

-- Trigger to auto-create profile on new user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, currency)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'ผู้ใช้งานใหม่'),
        'THB'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_flows_user_id ON public.cash_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_advisory_logs_user_id ON public.ai_advisory_logs(user_id);
