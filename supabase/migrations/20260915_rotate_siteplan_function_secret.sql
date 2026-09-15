create or replace function public.get_tender_notification_target(p_token uuid, p_submission_id uuid, p_secret text)
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
    and encode(extensions.digest(p_secret,'sha256'),'hex') = 'b8f6b398c1b9b68b7f614bfbe8e92b22abbb9ab7dc8bd3f30769ec5c242a1b4e'
  limit 1;
$$;

create or replace function public.record_tender_email_event(
  p_resend_email_id text, p_status text, p_message_id text, p_event jsonb, p_secret text
)
returns void language plpgsql security definer set search_path = public, extensions
as $$
begin
  if encode(extensions.digest(p_secret,'sha256'),'hex') <> 'b8f6b398c1b9b68b7f614bfbe8e92b22abbb9ab7dc8bd3f30769ec5c242a1b4e' then
    raise exception 'unauthorized';
  end if;
  update public.tender_email_deliveries
  set status = case when p_status in ('sent','delivered','delivery_delayed','bounced','failed','suppressed','complained') then p_status else status end,
      message_id = coalesce(p_message_id,message_id), last_event = p_event, updated_at = now()
  where resend_email_id = p_resend_email_id;
end;
$$;

