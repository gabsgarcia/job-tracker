-- 001_initial_schema.sql
-- Job Tracker: applications (1:N) tasks, each row owned by one user.
-- Run once in Supabase → SQL Editor → Run. Expected result: "Success. No rows returned".

-- ── Applications ────────────────────────────────────────────────────────────
create table public.applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company          text not null check (length(trim(company)) > 0),
  position         text not null check (length(trim(position)) > 0),
  status           text not null default 'applied'
                   check (status in ('applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  application_date date not null default current_date,
  notes            text,
  created_at       timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);

-- ── Tasks ───────────────────────────────────────────────────────────────────
create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  title          text not null check (length(trim(title)) > 0),
  due_date       date,
  done           boolean not null default false,
  created_at     timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_application_id_idx on public.tasks (application_id);

-- ── Row Level Security: each user only reads and writes their own rows ──────
alter table public.applications enable row level security;
alter table public.tasks enable row level security;

-- Rule: a user can only SEE applications whose user_id is their own id.
create policy "Users can read their own applications"
  on public.applications for select to authenticated
  using ((select auth.uid()) = user_id);

-- Rule: a user can only ADD an application owned by themselves.
create policy "Users can create their own applications"
  on public.applications for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Rule: a user can only EDIT their own applications (and cannot give them to someone else).
create policy "Users can update their own applications"
  on public.applications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Rule: a user can only DELETE their own applications.
create policy "Users can delete their own applications"
  on public.applications for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Rule: a user can only SEE their own tasks.
create policy "Users can read their own tasks"
  on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);

-- Rule: a user can only ADD a task to one of their own applications.
create policy "Users can create tasks on their own applications"
  on public.tasks for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  );

-- Rule: a user can only EDIT their own tasks.
create policy "Users can update their own tasks"
  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Rule: a user can only DELETE their own tasks.
create policy "Users can delete their own tasks"
  on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);
