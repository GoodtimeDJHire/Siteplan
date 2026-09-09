-- SitePlan cloud-first workspace storage

create table if not exists public.siteplan_event_plans (
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  event_name text not null default 'Untitled Event',
  plan_data jsonb,
  event_meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner_id, event_key)
);

alter table public.siteplan_event_plans enable row level security;

drop policy if exists "siteplan_event_plans_select_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_select_own"
on public.siteplan_event_plans for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "siteplan_event_plans_insert_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_insert_own"
on public.siteplan_event_plans for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "siteplan_event_plans_update_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_update_own"
on public.siteplan_event_plans for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "siteplan_event_plans_delete_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_delete_own"
on public.siteplan_event_plans for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists siteplan_event_plans_owner_updated_idx
  on public.siteplan_event_plans (owner_id, updated_at desc);

create table if not exists public.siteplan_workspace_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  workspace_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.siteplan_workspace_state enable row level security;

drop policy if exists "siteplan_workspace_state_select_own" on public.siteplan_workspace_state;
create policy "siteplan_workspace_state_select_own"
on public.siteplan_workspace_state for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "siteplan_workspace_state_insert_own" on public.siteplan_workspace_state;
create policy "siteplan_workspace_state_insert_own"
on public.siteplan_workspace_state for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "siteplan_workspace_state_update_own" on public.siteplan_workspace_state;
create policy "siteplan_workspace_state_update_own"
on public.siteplan_workspace_state for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

grant select, insert, update, delete on public.siteplan_event_plans to authenticated;
grant select, insert, update on public.siteplan_workspace_state to authenticated;
