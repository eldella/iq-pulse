-- IQ.Pulse quiz engine schema.
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor) on the
-- linked project. Not applied automatically - this repo only holds the
-- anon key client-side (lib/supabase/client.ts), which has no DDL rights.
--
-- Design decisions baked into this schema:
-- - Results are never gated behind an account or email (see Sostenimiento/
--   Términos: "no hay resultados bloqueados"). `quiz_sessions.user_id` is
--   nullable so anonymous play works end to end; profiles are optional.
-- - Three cognitive domains match the ones already shown on the landing
--   page (components/landing/DomainsSection.tsx): reasoning, memory, speed.
-- - IQ estimates land on the standard mean-100/SD-15 distribution used by
--   real IQ tests (see lib/scoring.ts).

create extension if not exists "pgcrypto";

-- Optional profile info, one row per authenticated user. Playing/seeing
-- results never requires this to exist.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text not null,
  country text, -- ISO 3166-1 alpha-2, for future local/national/continental ranking tiers
  created_at timestamptz not null default now()
);

-- Question bank. `prompt`/`correct_answer` are jsonb so different question
-- shapes (multiple choice, pattern grid, sequence, etc.) can share one table
-- without a rigid column-per-type structure.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  domain text not null check (domain in ('reasoning', 'memory', 'speed')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  prompt jsonb not null,
  correct_answer jsonb not null,
  created_at timestamptz not null default now()
);

-- One row per full test attempt. `user_id` null = anonymous session.
create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  iq_estimate integer,
  percentile numeric(5, 2)
);

-- One row per answered question within a session.
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  is_correct boolean not null,
  response_time_ms integer not null,
  difficulty_at_time text not null check (difficulty_at_time in ('easy', 'medium', 'hard')),
  answered_at timestamptz not null default now()
);

-- Row Level Security: the client only ever holds the anon key, so every
-- permission has to be explicit here, not assumed from server-side trust.
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;

-- Profiles: publicly readable (needed for leaderboard aliases), only the
-- owning user can create/update their own row.
create policy "profiles are publicly readable" on public.profiles
  for select using (true);
create policy "users manage their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "users update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Questions: publicly readable (the client needs to fetch them to run the
-- quiz), never writable from the client.
create policy "questions are publicly readable" on public.questions
  for select using (true);

-- Sessions: anyone can start one (including anonymous, user_id null);
-- publicly readable so aggregate/leaderboard queries can run client-side.
create policy "sessions are publicly readable" on public.quiz_sessions
  for select using (true);
create policy "anyone can start a session" on public.quiz_sessions
  for insert with check (user_id is null or auth.uid() = user_id);
create policy "session owner can update their session" on public.quiz_sessions
  for update using (user_id is null or auth.uid() = user_id);

-- Answers: publicly readable (aggregate stats), insertable by anyone tied
-- to a session they own (or an anonymous one).
create policy "answers are publicly readable" on public.quiz_answers
  for select using (true);
create policy "anyone can record an answer for their session" on public.quiz_answers
  for insert with check (
    exists (
      select 1 from public.quiz_sessions s
      where s.id = session_id and (s.user_id is null or s.user_id = auth.uid())
    )
  );
