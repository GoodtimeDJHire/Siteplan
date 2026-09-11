create table if not exists public.tender_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.tenders(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  supplier_id uuid null references public.suppliers(id) on delete set null,
  company_name text not null,
  recipient_email text not null,
  resend_email_id text unique,
  message_id text,
  status text not null default 'sent' check (status in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained')),
  last_event jsonb,
  sent_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tender_email_deliveries_tender_idx on public.tender_email_deliveries(tender_id);
create index if not exists tender_email_deliveries_owner_idx on public.tender_email_deliveries(owner_id);
create index if not exists tender_email_deliveries_resend_idx on public.tender_email_deliveries(resend_email_id);

alter table public.tender_email_deliveries enable row level security;

drop policy if exists "Owners can view tender email deliveries" on public.tender_email_deliveries;
create policy "Owners can view tender email deliveries"
on public.tender_email_deliveries
for select
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "Owners can insert tender email deliveries" on public.tender_email_deliveries;
create policy "Owners can insert tender email deliveries"
on public.tender_email_deliveries
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete tender email deliveries" on public.tender_email_deliveries;
create policy "Owners can delete tender email deliveries"
on public.tender_email_deliveries
for delete
to authenticated
using (owner_id = (select auth.uid()));

create or replace function public.record_tender_email_event(
  p_resend_email_id text,
  p_status text,
  p_message_id text default null,
  p_event jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tender_email_deliveries
  set status = case
      when p_status in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained') then p_status
      else status
    end,
    message_id = coalesce(p_message_id, message_id),
    last_event = p_event,
    updated_at = now()
  where resend_email_id = p_resend_email_id;
end;
$$;

revoke all on function public.record_tender_email_event(text,text,text,jsonb) from public;
grant execute on function public.record_tender_email_event(text,text,text,jsonb) to anon, authenticated;
