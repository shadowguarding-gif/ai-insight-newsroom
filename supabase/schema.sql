create extension if not exists pgcrypto;

create table if not exists public.ai_insight_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  state jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_insight_sessions (
  token_hash text primary key,
  user_id uuid not null references public.ai_insight_accounts(id) on delete cascade,
  issued_at timestamptz not null,
  last_seen_at timestamptz not null,
  expires_at timestamptz not null
);

create index if not exists ai_insight_accounts_email_idx
  on public.ai_insight_accounts (email);

create index if not exists ai_insight_sessions_user_id_idx
  on public.ai_insight_sessions (user_id);

create index if not exists ai_insight_sessions_expires_at_idx
  on public.ai_insight_sessions (expires_at);

alter table public.ai_insight_accounts enable row level security;
alter table public.ai_insight_sessions enable row level security;
