-- Run this ONCE in Supabase SQL Editor if you see no tables.
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS).

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('job_seeker', 'mentor', 'recruiter')),
  display_name text not null,
  industry text not null default '',
  skills text[] not null default '{}',
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- -----------------------------------------------------------------------------
-- CONNECTIONS
-- -----------------------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(from_user_id, to_user_id),
  check (from_user_id != to_user_id)
);

create index if not exists connections_from_user_id on public.connections(from_user_id);
create index if not exists connections_to_user_id on public.connections(to_user_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.connections enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select to authenticated using (true);

drop policy if exists "Anon can view profiles" on public.profiles;
create policy "Anon can view profiles" on public.profiles for select to anon using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can view own connections" on public.connections;
create policy "Users can view own connections" on public.connections for select to authenticated using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "Users can create connection as sender" on public.connections;
create policy "Users can create connection as sender" on public.connections for insert to authenticated with check (auth.uid() = from_user_id);

drop policy if exists "Users can update connection when they are the recipient" on public.connections;
create policy "Users can update connection when they are the recipient" on public.connections for update to authenticated using (auth.uid() = to_user_id);

-- -----------------------------------------------------------------------------
-- TRIGGERS (updated_at)
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists connections_updated_at on public.connections;
create trigger connections_updated_at before update on public.connections for each row execute function public.set_updated_at();
