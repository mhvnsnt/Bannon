-- Supabase Migration: CODEDUMMY Commercial Security and Token Economics
-- Targets workspaces, user credits, and agent audit logs with hard Row Level Security and transactional RPC

-- 1. Create Core Workspaces Table if not exists
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Granular User Credits Table
create table if not exists user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 100 check (credits >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Agent Audit Log Table for the Financial Circuit Breaker
create table if not exists agent_audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  credits_deducted integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all database tables
alter table workspaces enable row level security;
alter table user_credits enable row level security;
alter table agent_audit_log enable row level security;

-- Establish Zero-Trust policies where auth.uid() matches user_id
create policy "Users can only see and edit their own workspaces" 
  on workspaces 
  for all 
  using (auth.uid() = user_id);

create policy "Users can view their own credits" 
  on user_credits 
  for select 
  using (auth.uid() = user_id);

create policy "Users can view their own audit logs" 
  on agent_audit_log 
  for select 
  using (auth.uid() = user_id);

-- 4. Supabase RPC (Remote Procedure Call) named 'deduct_compute_credits'
-- Uses SECURITY DEFINER to securely execute transactional credit updates on behalf of users
create or replace function deduct_compute_credits(
  p_user_id uuid,
  p_credit_cost integer,
  p_action text
)
returns json
language plpgsql
security definer
as $$
declare
  v_current_credits integer;
begin
  -- Check user's current credits, defaulting to 100 if entry does not exist
  select credits into v_current_credits
  from user_credits
  where user_id = p_user_id;

  if v_current_credits is null then
    insert into user_credits (user_id, credits)
    values (p_user_id, 100)
    returning credits into v_current_credits;
  end if;

  -- Validate sufficient credit balance
  if v_current_credits < p_credit_cost then
    return json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'current_balance', v_current_credits,
      'required_credits', p_credit_cost
    );
  end if;

  -- Transactional credit deduction
  update user_credits
  set credits = credits - p_credit_cost,
      updated_at = now()
  where user_id = p_user_id;

  -- Log action inside the Agent Audit Log
  insert into agent_audit_log (user_id, action, credits_deducted)
  values (p_user_id, p_action, p_credit_cost);

  return json_build_object(
    'success', true,
    'remaining_balance', v_current_credits - p_credit_cost
  );
end;
$$;
