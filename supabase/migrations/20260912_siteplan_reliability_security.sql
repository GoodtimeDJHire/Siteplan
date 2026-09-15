create extension if not exists pgcrypto with schema extensions;

alter table public.tender_email_deliveries
  add column if not exists email_type text not null default 'tender_invitation';

alter table public.tender_email_deliveries
  drop constraint if exists tender_email_deliveries_email_type_check;
alter table public.tender_email_deliveries
  add constraint tender_email_deliveries_email_type_check
  check (email_type in ('tender_invitation','quote_received','quote_decision'));

create index if not exists tender_email_deliveries_supplier_idx
  on public.tender_email_deliveries(supplier_id);
drop index if exists public.tender_email_deliveries_resend_idx;
drop index if exists public.suppliers_owner_idx;

drop policy if exists "siteplan_event_plans_select_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_select_own" on public.siteplan_event_plans
for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "siteplan_event_plans_insert_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_insert_own" on public.siteplan_event_plans
for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "siteplan_event_plans_update_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_update_own" on public.siteplan_event_plans
for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "siteplan_event_plans_delete_own" on public.siteplan_event_plans;
create policy "siteplan_event_plans_delete_own" on public.siteplan_event_plans
for delete to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "siteplan_workspace_state_select_own" on public.siteplan_workspace_state;
create policy "siteplan_workspace_state_select_own" on public.siteplan_workspace_state
for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "siteplan_workspace_state_insert_own" on public.siteplan_workspace_state;
create policy "siteplan_workspace_state_insert_own" on public.siteplan_workspace_state
for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "siteplan_workspace_state_update_own" on public.siteplan_workspace_state;
create policy "siteplan_workspace_state_update_own" on public.siteplan_workspace_state
for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop function if exists public.get_tender_notification_target(uuid);
create function public.get_tender_notification_target(p_token uuid, p_submission_id uuid, p_secret text)
returns table(
  organizer_email text, tender_title text, event_name text, owner_id uuid,
  tender_id uuid, company_name text, contact_name text, supplier_email text,
  price numeric, gst_included boolean, inclusions text, notes text, answers jsonb
)
language sql security definer set search_path = public, extensions
as $$
  select t.organizer_email, t.title, coalesce(e.name,'Event'), t.owner_id,
    t.id, s.company_name, s.contact_name, s.email, s.price, s.gst_included,
    s.inclusions, s.notes, s.answers
  from public.tenders t
  join public.tender_submissions s on s.tender_id = t.id
  left join public.events e on e.id = t.event_id
  where t.public_token = p_token
    and s.id = p_submission_id
    and encode(extensions.digest(p_secret,'sha256'),'hex') = '5a408f18bc077f44a78517b12540e8be186cc781e788ebe869bebf342bc028c9'
  limit 1;
$$;
revoke all on function public.get_tender_notification_target(uuid,uuid,text) from public, authenticated;
grant execute on function public.get_tender_notification_target(uuid,uuid,text) to anon, service_role;

drop function if exists public.record_tender_email_event(text,text,text,jsonb);
create function public.record_tender_email_event(
  p_resend_email_id text, p_status text, p_message_id text, p_event jsonb, p_secret text
)
returns void language plpgsql security definer set search_path = public, extensions
as $$
begin
  if encode(extensions.digest(p_secret,'sha256'),'hex') <> '5a408f18bc077f44a78517b12540e8be186cc781e788ebe869bebf342bc028c9' then
    raise exception 'unauthorized';
  end if;
  update public.tender_email_deliveries
  set status = case when p_status in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained') then p_status else status end,
      message_id = coalesce(p_message_id,message_id), last_event = p_event, updated_at = now()
  where resend_email_id = p_resend_email_id;
end;
$$;
revoke all on function public.record_tender_email_event(text,text,text,jsonb,text) from public, authenticated;
grant execute on function public.record_tender_email_event(text,text,text,jsonb,text) to anon, service_role;

revoke all on function public.siteplan_set_tender_organizer_email() from public, anon, authenticated;

