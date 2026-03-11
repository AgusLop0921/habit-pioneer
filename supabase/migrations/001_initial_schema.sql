-- ─────────────────────────────────────────────────────────────────────────────
-- Habits Pioneer – Initial Schema
-- Run this migration in Supabase SQL Editor or via supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension (already enabled in Supabase by default)
-- create extension if not exists "uuid-ossp";

-- ─── Habits ──────────────────────────────────────────────────────────────────

create table if not exists public.habits (
  id           text        primary key,          -- client-generated UUID
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  description  text,
  emoji        text,
  frequency    text        not null default 'daily', -- 'daily' | 'weekly' | 'monthly'
  week_days    integer[],                         -- [1,2,3,4,5] for Mon-Fri
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz                        -- soft delete
);

alter table public.habits enable row level security;

create policy "habits: users manage own" on public.habits
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Habit History ────────────────────────────────────────────────────────────
-- Flattened from the nested Record<date, Record<habitId, boolean>> structure

create table if not exists public.habit_history (
  user_id      uuid   not null references auth.users(id) on delete cascade,
  habit_id     text   not null,
  date         date   not null,                  -- YYYY-MM-DD
  done         boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);

alter table public.habit_history enable row level security;

create policy "habit_history: users manage own" on public.habit_history
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Tasks ───────────────────────────────────────────────────────────────────

create table if not exists public.tasks (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  title        text        not null,
  priority     text        not null default 'medium', -- 'high' | 'medium' | 'low'
  date         date        not null,
  completed    boolean     not null default false,
  category     text        not null default 'personal',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table public.tasks enable row level security;

create policy "tasks: users manage own" on public.tasks
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Weekly Goals ─────────────────────────────────────────────────────────────

create table if not exists public.weekly_goals (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  title        text        not null,
  target_count integer     not null default 1,
  week_start   date        not null,
  completions  text[]      not null default '{}', -- array of ISO timestamps
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table public.weekly_goals enable row level security;

create policy "weekly_goals: users manage own" on public.weekly_goals
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Shopping Items ───────────────────────────────────────────────────────────

create table if not exists public.shopping_items (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  quantity     integer     not null default 1,
  category     text        not null default 'general', -- 'food' | 'cleaning' | 'hygiene' | 'general'
  checked      boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table public.shopping_items enable row level security;

create policy "shopping_items: users manage own" on public.shopping_items
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Custom Categories ────────────────────────────────────────────────────────

create table if not exists public.custom_categories (
  id           text        not null,             -- user-defined category ID
  user_id      uuid        not null references auth.users(id) on delete cascade,
  label        text        not null,
  emoji        text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  primary key  (user_id, id)
);

alter table public.custom_categories enable row level security;

create policy "custom_categories: users manage own" on public.custom_categories
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Pomodoro Sessions ────────────────────────────────────────────────────────

create table if not exists public.pomodoro_sessions (
  id               text        primary key,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  mode             text        not null,          -- 'work' | 'shortBreak' | 'longBreak'
  linked_task_id   text,
  duration_seconds integer     not null,
  completed_at     timestamptz not null,
  created_at       timestamptz not null default now()
);

alter table public.pomodoro_sessions enable row level security;

create policy "pomodoro_sessions: users manage own" on public.pomodoro_sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Pomodoro Settings ────────────────────────────────────────────────────────

create table if not exists public.pomodoro_settings (
  user_id                   uuid    primary key references auth.users(id) on delete cascade,
  work_duration             integer not null default 25,
  short_break_duration      integer not null default 5,
  long_break_duration       integer not null default 15,
  sessions_until_long_break integer not null default 4,
  auto_start_break          boolean not null default false,
  sound_enabled             boolean not null default false,
  updated_at                timestamptz not null default now()
);

alter table public.pomodoro_settings enable row level security;

create policy "pomodoro_settings: users manage own" on public.pomodoro_settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Sleep Logs ───────────────────────────────────────────────────────────────

create table if not exists public.sleep_logs (
  user_id        uuid    not null references auth.users(id) on delete cascade,
  night_date     date    not null,              -- YYYY-MM-DD (date of going to bed)
  bedtime        text    not null default '',   -- HH:mm
  wake_time      text    not null default '',   -- HH:mm
  total_minutes  integer not null default 0,
  hours_slept    real    not null default 0,
  quality        integer not null default 0,    -- 0-5
  wake_ups       integer not null default 0,
  checklist_done text[]  not null default '{}',
  notes          text,
  updated_at     timestamptz not null default now(),
  primary key    (user_id, night_date)
);

alter table public.sleep_logs enable row level security;

create policy "sleep_logs: users manage own" on public.sleep_logs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Sleep Enrollment ─────────────────────────────────────────────────────────

create table if not exists public.sleep_enrollment (
  user_id         uuid    primary key references auth.users(id) on delete cascade,
  is_enrolled     boolean not null default false,
  onboarding_done boolean not null default false,
  updated_at      timestamptz not null default now()
);

alter table public.sleep_enrollment enable row level security;

create policy "sleep_enrollment: users manage own" on public.sleep_enrollment
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── User Settings ────────────────────────────────────────────────────────────

create table if not exists public.user_settings (
  user_id    uuid    primary key references auth.users(id) on delete cascade,
  language   text    not null default 'es',
  theme_mode text    not null default 'dark',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings: users manage own" on public.user_settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Indexes for performance ──────────────────────────────────────────────────

create index if not exists habits_user_id_idx        on public.habits(user_id);
create index if not exists habit_history_user_id_idx on public.habit_history(user_id);
create index if not exists tasks_user_id_idx         on public.tasks(user_id);
create index if not exists tasks_date_idx            on public.tasks(user_id, date);
create index if not exists weekly_goals_user_id_idx  on public.weekly_goals(user_id);
create index if not exists shopping_user_id_idx      on public.shopping_items(user_id);
create index if not exists pomodoro_sessions_uid_idx on public.pomodoro_sessions(user_id);
create index if not exists sleep_logs_user_id_idx    on public.sleep_logs(user_id);
