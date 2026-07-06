-- Supabase Migration: Bannon RLS Policies
-- Targets workspaces, roster, and engine_attires tables with Row Level Security.
-- Ensures standard users can only query/modify rows matching their authenticated UID,
-- while reserving full administrative access for the 'admin' account and MarquisWhitacre@gmail.com.

-- 1. Create Roster Table if not exists
create table if not exists roster (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archetype text,
  poise integer default 100,
  stamina integer default 100,
  hp integer default 10000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Engine Attires Table if not exists
create table if not exists engine_attires (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  wrestler_id uuid,
  attire_name text not null,
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table workspaces enable row level security;
alter table roster enable row level security;
alter table engine_attires enable row level security;

-- 4. Clean up any existing policies to prevent conflicts
drop policy if exists "Users can only see and edit their own workspaces" on workspaces;
drop policy if exists "Workspaces security policy" on workspaces;
drop policy if exists "Roster security policy" on roster;
drop policy if exists "Engine attires security policy" on engine_attires;

-- 5. Establish Zero-Trust policies for Workspaces (User + Admin roles)
create policy "Workspaces security policy"
  on workspaces
  for all
  using (
    auth.uid() = user_id 
    or (auth.jwt() ->> 'email') = 'MarquisWhitacre@gmail.com'
    or (auth.jwt() ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = user_id 
    or (auth.jwt() ->> 'email') = 'MarquisWhitacre@gmail.com'
    or (auth.jwt() ->> 'role') = 'admin'
  );

-- 6. Establish Zero-Trust policies for Roster (User + Admin roles)
create policy "Roster security policy"
  on roster
  for all
  using (
    auth.uid() = user_id 
    or (auth.jwt() ->> 'email') = 'MarquisWhitacre@gmail.com'
    or (auth.jwt() ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = user_id 
    or (auth.jwt() ->> 'email') = 'MarquisWhitacre@gmail.com'
    or (auth.jwt() ->> 'role') = 'admin'
  );

-- 7. Establish Zero-Trust policies for Engine Attires (User + Admin roles)
create policy "Engine attires security policy"
  on engine_attires
  for all
  using (
    auth.uid() = user_id 
    or (auth.jwt() ->> 'email') = 'MarquisWhitacre@gmail.com'
    or (auth.jwt() ->> 'role') = 'admin'
  )
  with check (
    auth.uid() = user_id 
    or (auth.jwt() ->> 'email') = 'MarquisWhitacre@gmail.com'
    or (auth.jwt() ->> 'role') = 'admin'
  );
