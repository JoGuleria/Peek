-- Peek: initial schema for users, profiles, and connections
-- Run this in the Supabase SQL Editor (or via Supabase CLI: supabase db push)

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =============================================================================
-- PROFILES
-- One row per user; extends Supabase auth.users. user_id = auth.uid()
-- =============================================================================
create table public.profiles (
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

-- One profile per user
create unique index profiles_user_id_key on public.profiles(user_id);

-- =============================================================================
-- CONNECTIONS
-- When user A clicks "Connect" on user B, we insert (from_user_id=A, to_user_id=B)
-- =============================================================================
create table public.connections (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(from_user_id, to_user_id),
  check (from_user_id != to_user_id)
);

create index connections_from_user_id on public.connections(from_user_id);
create index connections_to_user_id on public.connections(to_user_id);

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.connections enable row level security;

-- Profiles: anyone signed in can read all profiles; only own row can be updated
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- Connections: users can see connections they're part of; can create as from_user
create policy "Users can view own connections"
  on public.connections for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create connection as sender"
  on public.connections for insert
  to authenticated
  with check (auth.uid() = from_user_id);

create policy "Users can update connection when they are the recipient"
  on public.connections for update
  to authenticated
  using (auth.uid() = to_user_id);

-- =============================================================================
-- TRIGGERS: keep updated_at in sync
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger connections_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- =============================================================================
-- OPTIONAL: auto-create empty profile on signup (handle in app or trigger)
-- Uncomment if you want Supabase to create a row in profiles when a user signs up.
-- You'll still need to redirect them to profile setup to set role, name, etc.
-- =============================================================================
-- create or replace function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.profiles (user_id, display_name)
--   values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
--   return new;
-- end;
-- $$ language plpgsql security definer;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
