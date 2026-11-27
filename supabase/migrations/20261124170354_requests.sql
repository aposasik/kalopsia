-- Βήμα 5: αίτημα με selfie, για τις μεγάλες αλλαγές (π.χ. balayage).
-- Ο πελάτης δεν κλείνει ώρα: στέλνει φωτογραφία και τι θέλει, και το μαγαζί απαντά.

alter table public.services add column by_request boolean not null default false;

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id),
  wish text not null check (length(trim(wish)) >= 5),           -- τι θέλει να κάνει
  preferred text not null default '',                            -- ποιες μέρες και ώρες τον βολεύουν
  channel text not null check (channel in ('viber', 'whatsapp', 'phone')),
  client_name text not null check (length(trim(client_name)) >= 2),
  client_phone text not null check (length(trim(client_phone)) >= 10),
  photo_path text not null,                                      -- το όνομα του αρχείου στον κάδο selfies
  consent_at timestamptz not null,                               -- πότε συμφώνησε να σταλεί η φωτογραφία του
  status text not null default 'new' check (status in ('new', 'answered', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.requests enable row level security;
revoke all on public.requests from anon;
grant select, update, delete on public.requests to authenticated;
create policy requests_owner on public.requests for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Ο επισκέπτης στέλνει αίτημα μόνο από εδώ. Χωρίς συγκατάθεση δεν γράφεται τίποτα.
create function public.create_request(
  p_service uuid, p_wish text, p_preferred text, p_channel text,
  p_name text, p_phone text, p_photo_path text, p_consent boolean
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_consent is not true then
    raise exception 'consent required' using errcode = 'KP010';
  end if;
  if not exists (select 1 from public.services where id = p_service and active and by_request) then
    raise exception 'unknown service' using errcode = 'KP001';
  end if;
  -- Το όνομα του αρχείου το φτιάχνει η εφαρμογή: 36 χαρακτήρες uuid και «.jpg». Τίποτα άλλο δεν περνά.
  if p_photo_path !~ '^[0-9a-f-]{36}\.jpg$' then
    raise exception 'bad photo path' using errcode = 'KP011';
  end if;

  insert into public.requests (service_id, wish, preferred, channel, client_name, client_phone, photo_path, consent_at)
  values (p_service, p_wish, coalesce(p_preferred, ''), p_channel, p_name, p_phone, p_photo_path, now())
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_request(uuid, text, text, text, text, text, text, boolean) from public;
grant execute on function public.create_request(uuid, text, text, text, text, text, text, boolean) to anon, authenticated;