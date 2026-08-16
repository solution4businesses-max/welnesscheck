-- Draft Supabase schema for "The Pure Path" wellness coaching app
-- Based on live review of the 7-screen prototype (aura-path-spark.lovable.app)
-- This is a proposal artifact, not yet applied to any project.

create type user_role as enum ('client', 'coach');
create type goal_status as enum ('active', 'completed', 'paused');
create type goal_cadence as enum ('daily', 'weekdays', 'custom');
create type content_type as enum ('audio', 'video', 'pdf');
create type journal_source as enum ('free', 'session', 'library');

-- One row per authenticated user (client or coach), 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

-- Coach-specific fields, kept separate so profiles stays lean
create table coaches (
  id uuid primary key references profiles(id) on delete cascade,
  bio text,
  credentials text,
  specialties text[]
);

-- Which coach a client is assigned to, plus program length (prototype shows "Week 3 of 12")
create table coach_clients (
  coach_id uuid not null references coaches(id) on delete cascade,
  client_id uuid not null references profiles(id) on delete cascade,
  program_started_on date not null default current_date,
  program_length_weeks int not null default 12,
  status text not null default 'active',
  primary key (coach_id, client_id)
);

-- Daily check-ins. NOTE: the prototype uses two different mood-tag sets on
-- different screens (home: Tender/Heavy/Steady/Lifted/Open vs. check-in flow:
-- Heavy/Low/Steady/Open/Bright). Recommend picking one canonical taxonomy
-- before building this table — using free text + a lookup table below so it's
-- a content change, not a migration, if the client wants to adjust wording later.
create table mood_tags (
  slug text primary key,
  label text not null,
  sort_order int not null
);

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  mood_slug text not null references mood_tags(slug),
  note text,
  checked_in_at timestamptz not null default now(),
  check_in_date date not null default current_date,
  unique (client_id, check_in_date)
);

-- Private by default; a client can selectively share an entry with their coach
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  source journal_source not null default 'free',
  prompt_text text,
  body text not null default '',
  word_count int generated always as (array_length(regexp_split_to_array(trim(body), '\s+'), 1)) stored,
  shared_with_coach boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid references coaches(id),
  title text not null,
  detail text,
  cadence goal_cadence not null default 'daily',
  target_days_per_week int not null default 7,
  status goal_status not null default 'active',
  coach_note text,
  created_at timestamptz not null default now()
);

-- One row per day a goal is marked done, drives the Mon-Sun grid in the UI
create table goal_logs (
  goal_id uuid not null references goals(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  primary key (goal_id, log_date)
);

create table weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  week_number int not null,
  unlocks_at timestamptz not null,
  body text,
  submitted_at timestamptz,
  unique (client_id, week_number)
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid not null references coaches(id),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 50,
  status text not null default 'scheduled',
  prep_note text -- the "want to talk about..." field seen on the therapist prep card
);

create table library_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table library_content (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references library_collections(id),
  title text not null,
  type content_type not null,
  duration_seconds int,
  storage_path text, -- private bucket path; never a public URL
  is_new boolean not null default false,
  created_by_coach_id uuid references coaches(id),
  created_at timestamptz not null default now()
);

-- Coach's weekly personalized pick, shown at the top of the Library screen
create table coach_picks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  content_id uuid not null references library_content(id),
  coach_note text,
  week_of date not null
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id),
  client_id uuid not null references profiles(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Row Level Security — every table enabled, no table left on the default
-- Postgres grants (verified locally: a coach role with no policy on a table
-- gets "permission denied", not open access — but that only holds if RLS is
-- actually turned on for that table, so this list is exhaustive on purpose).
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table coaches enable row level security;
alter table coach_clients enable row level security;
alter table check_ins enable row level security;
alter table journal_entries enable row level security;
alter table goals enable row level security;
alter table goal_logs enable row level security;
alter table weekly_reflections enable row level security;
alter table sessions enable row level security;
alter table library_collections enable row level security;
alter table library_content enable row level security;
alter table coach_picks enable row level security;
alter table messages enable row level security;

-- Table-level grants: RLS narrows *within* these, it doesn't substitute for them.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  profiles, coaches, coach_clients, check_ins, journal_entries, goals, goal_logs,
  weekly_reflections, sessions, library_collections, library_content, coach_picks, messages
  to authenticated;

-- profiles: see your own row, or the coach/client on the other end of your relationship
create policy "read own or linked profile" on profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = profiles.id)
    or exists (select 1 from coach_clients cc where cc.client_id = auth.uid() and cc.coach_id = profiles.id)
  );
create policy "update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "read own or linked coach record" on coaches
  for select using (
    auth.uid() = id
    or exists (select 1 from coach_clients cc where cc.client_id = auth.uid() and cc.coach_id = coaches.id)
  );

create policy "participants read coach_clients link" on coach_clients
  for select using (auth.uid() = coach_id or auth.uid() = client_id);

create policy "clients read own check-ins" on check_ins
  for select using (auth.uid() = client_id);
create policy "clients write own check-ins" on check_ins
  for insert with check (auth.uid() = client_id);
create policy "clients update own check-ins" on check_ins
  for update using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "coach reads own clients check-ins" on check_ins
  for select using (
    exists (select 1 from coach_clients cc where cc.client_id = check_ins.client_id and cc.coach_id = auth.uid())
  );

create policy "clients manage own journal entries" on journal_entries
  for all using (auth.uid() = client_id) with check (auth.uid() = client_id);

-- Coach can only see journal entries explicitly shared, and only for their own clients
create policy "coach reads shared journal entries" on journal_entries
  for select using (
    shared_with_coach = true
    and exists (
      select 1 from coach_clients cc
      where cc.client_id = journal_entries.client_id
        and cc.coach_id = auth.uid()
    )
  );

create policy "coach reads own clients goals" on goals
  for select using (
    auth.uid() = client_id
    or exists (
      select 1 from coach_clients cc
      where cc.client_id = goals.client_id and cc.coach_id = auth.uid()
    )
  );
-- Goals are "set together" per the prototype copy, but written by the coach
create policy "coach manages own clients goals" on goals
  for insert with check (
    auth.uid() = coach_id
    and exists (select 1 from coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = goals.client_id)
  );
create policy "coach updates own clients goals" on goals
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

create policy "clients manage own goal logs" on goal_logs
  for all using (
    exists (select 1 from goals g where g.id = goal_logs.goal_id and g.client_id = auth.uid())
  ) with check (
    exists (select 1 from goals g where g.id = goal_logs.goal_id and g.client_id = auth.uid())
  );
create policy "coach reads clients goal logs" on goal_logs
  for select using (
    exists (
      select 1 from goals g
      join coach_clients cc on cc.client_id = g.client_id
      where g.id = goal_logs.goal_id and cc.coach_id = auth.uid()
    )
  );

create policy "clients manage own weekly reflections" on weekly_reflections
  for all using (auth.uid() = client_id) with check (auth.uid() = client_id);
create policy "coach reads clients weekly reflections" on weekly_reflections
  for select using (
    exists (select 1 from coach_clients cc where cc.client_id = weekly_reflections.client_id and cc.coach_id = auth.uid())
  );

create policy "participants read sessions" on sessions
  for select using (auth.uid() = client_id or auth.uid() = coach_id);
create policy "coach manages sessions" on sessions
  for insert with check (auth.uid() = coach_id) ;
create policy "coach updates sessions" on sessions
  for update using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

-- Library is a shared catalog: any authenticated user can browse it, only coaches publish to it
create policy "authenticated users read library collections" on library_collections
  for select using (auth.uid() is not null);
create policy "coaches manage library collections" on library_collections
  for insert with check (exists (select 1 from coaches c where c.id = auth.uid()));
create policy "authenticated users read library content" on library_content
  for select using (auth.uid() is not null);
create policy "coaches manage library content" on library_content
  for insert with check (exists (select 1 from coaches c where c.id = auth.uid()));

create policy "clients read own coach picks" on coach_picks
  for select using (
    auth.uid() = client_id
    or exists (select 1 from coach_clients cc where cc.client_id = coach_picks.client_id and cc.coach_id = auth.uid())
  );
create policy "coach creates picks for own clients" on coach_picks
  for insert with check (
    exists (select 1 from coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = coach_picks.client_id)
  );

create policy "thread participants read messages" on messages
  for select using (auth.uid() = client_id or auth.uid() = coach_id);
create policy "thread participants send messages" on messages
  for insert with check (auth.uid() = sender_id and (auth.uid() = client_id or auth.uid() = coach_id));
