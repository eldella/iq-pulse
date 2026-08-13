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

-- One row per answered question within a session. `question_id` is
-- nullable: the first 3 minigames (pattern matrix, digit span, Stroop)
-- generate their content procedurally on the client instead of drawing
-- from the `questions` bank, so there's often no pre-existing row to point
-- to - `domain` is stored directly on the answer instead so aggregate
-- queries don't depend on a `questions` join that may not exist.
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  question_id uuid references public.questions (id),
  domain text not null check (domain in ('reasoning', 'memory', 'speed')),
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

-- Daily Challenge results, one row per device per day - `unique
-- (device_id, challenge_date)` is what makes "once every 24h" real. The
-- upsert (via the upsert_daily_result() function below, called from
-- lib/supabase/quiz.ts through supabase.rpc()) keeps the *better* score if
-- the daily challenge is replayed the same day - the Supabase JS client's
-- plain `.upsert()` always overwrites on conflict, it can't express a
-- conditional `greatest()`, which is why this goes through a function
-- instead of a direct table upsert.
--
-- `device_id` is a client-generated anonymous id (lib/deviceIdentity.ts),
-- not tied to `auth.users` - there is no real login on this site (see
-- AuthProvider's docstring), so there's no server-side way to verify a
-- write actually came from that device's rightful owner. Same open trust
-- model already accepted for quiz_sessions/quiz_answers above - fine for a
-- low-stakes hobby leaderboard, not a defense against real cheating.
create table public.daily_results (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  alias text not null,
  challenge_date date not null,
  points integer not null check (points between 0 and 1000),
  streak integer not null default 0,
  session_id uuid references public.quiz_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (device_id, challenge_date)
);

alter table public.daily_results enable row level security;

create policy "daily results are publicly readable" on public.daily_results
  for select using (true);
create policy "anyone can upsert their own daily result" on public.daily_results
  for insert with check (true);
create policy "anyone can update their own daily result" on public.daily_results
  for update using (true);

-- security invoker (the default, spelled out for clarity): runs as the
-- calling anon/authenticated role, so the RLS policies above still apply -
-- this function only changes how the upsert's conflict is resolved, not
-- who's allowed to call it.
create or replace function public.upsert_daily_result(
  p_device_id text,
  p_alias text,
  p_challenge_date date,
  p_points integer,
  p_streak integer,
  p_session_id uuid
) returns void
language sql
security invoker
as $$
  insert into public.daily_results (device_id, alias, challenge_date, points, streak, session_id)
  values (p_device_id, p_alias, p_challenge_date, p_points, p_streak, p_session_id)
  on conflict (device_id, challenge_date)
  do update set
    points = greatest(public.daily_results.points, excluded.points),
    streak = excluded.streak,
    alias = excluded.alias,
    session_id = excluded.session_id;
$$;

grant execute on function public.upsert_daily_result to anon, authenticated;

-- Leaderboard reads. The JS client's plain `.select()` can't express the
-- per-device grouping/aggregation these need, so - same reasoning as
-- upsert_daily_result() above - these go through RPC functions instead.
-- Grouped by device_id (not alias): the auto-generated alias space in
-- lib/deviceIdentity.ts is only 10x10 combos, so aliases can collide across
-- real devices - device_id is what's actually unique, alias is display-only.

create or replace function public.leaderboard_general(limit_n integer default 10)
returns table (device_id text, alias text, points integer)
language sql
security invoker
stable
as $$
  select device_id, (array_agg(alias order by challenge_date desc))[1] as alias, max(points) as points
  from public.daily_results
  group by device_id
  order by points desc
  limit limit_n;
$$;

-- Fastest total completion time on a daily run, joined to quiz_sessions for
-- started_at/completed_at (daily_results itself doesn't store elapsed time).
create or replace function public.leaderboard_times(limit_n integer default 10)
returns table (device_id text, alias text, seconds numeric)
language sql
security invoker
stable
as $$
  select dr.device_id,
         (array_agg(dr.alias order by dr.challenge_date desc))[1] as alias,
         min(extract(epoch from (qs.completed_at - qs.started_at))) as seconds
  from public.daily_results dr
  join public.quiz_sessions qs on qs.id = dr.session_id
  where qs.completed_at is not null
  group by dr.device_id
  order by seconds asc
  limit limit_n;
$$;

create or replace function public.leaderboard_percentiles(limit_n integer default 10)
returns table (device_id text, alias text, percentile numeric)
language sql
security invoker
stable
as $$
  select dr.device_id,
         (array_agg(dr.alias order by dr.challenge_date desc))[1] as alias,
         max(qs.percentile) as percentile
  from public.daily_results dr
  join public.quiz_sessions qs on qs.id = dr.session_id
  where qs.percentile is not null
  group by dr.device_id
  order by percentile desc
  limit limit_n;
$$;

-- Each device's most recent streak value, only counted if that last play was
-- today or yesterday - same grace-period rule as effectiveStreak() in
-- lib/dailyTraining.ts, so a device that stopped playing weeks ago doesn't
-- keep sitting at the top forever with a dead streak.
create or replace function public.leaderboard_streaks(limit_n integer default 10)
returns table (device_id text, alias text, streak integer)
language sql
security invoker
stable
as $$
  select device_id, alias, streak
  from (
    select distinct on (device_id) device_id, alias, streak, challenge_date
    from public.daily_results
    order by device_id, challenge_date desc
  ) latest
  where challenge_date >= (current_date - interval '1 day')::date
  order by streak desc
  limit limit_n;
$$;

grant execute on function public.leaderboard_general to anon, authenticated;
grant execute on function public.leaderboard_times to anon, authenticated;
grant execute on function public.leaderboard_percentiles to anon, authenticated;
grant execute on function public.leaderboard_streaks to anon, authenticated;
