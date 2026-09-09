alter table public.tenders add column if not exists organizer_email text;

update public.tenders t
set organizer_email = u.email
from auth.users u
where t.owner_id = u.id
  and (t.organizer_email is null or btrim(t.organizer_email) = '');

create or replace function public.siteplan_set_tender_organizer_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.organizer_email is null or btrim(new.organizer_email) = '' then
    select email into new.organizer_email
    from auth.users
    where id = new.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_siteplan_tender_organizer_email on public.tenders;
create trigger trg_siteplan_tender_organizer_email
before insert or update of owner_id on public.tenders
for each row execute function public.siteplan_set_tender_organizer_email();

create or replace function public.get_tender_notification_target(p_token uuid)
returns table(organizer_email text, tender_title text, event_name text)
language sql
security definer
set search_path = public
as $$
  select t.organizer_email, t.title, coalesce(e.name,'Event')
  from public.tenders t
  left join public.events e on e.id = t.event_id
  where t.public_token = p_token
  limit 1;
$$;

grant execute on function public.get_tender_notification_target(uuid) to anon, authenticated;
