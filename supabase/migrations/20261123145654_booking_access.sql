-- Βήμα 4: ποιος βλέπει τι.
-- Το Supabase έχει τρεις ρόλους: anon (επισκέπτης χωρίς σύνδεση), authenticated (συνδεδεμένος)
-- και service_role (ο server, περνά πάνω από όλους τους κανόνες).

alter table public.services enable row level security;
alter table public.stylists enable row level security;
alter table public.opening_hours enable row level security;
alter table public.appointments enable row level security;

-- Ιδιοκτήτης = συνδεδεμένος χρήστης που έχει role "owner" στο app_metadata του.
-- Το app_metadata το αλλάζει μόνο ο server, ποτέ ο ίδιος ο χρήστης.
create function public.is_owner() returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner', false);
$$;

-- Τιμοκατάλογος, κομμωτές, ωράριο: τα διαβάζουν όλοι, τα αλλάζει μόνο ο ιδιοκτήτης.
grant select on public.services, public.stylists, public.opening_hours to anon, authenticated;
grant insert, update, delete on public.services, public.stylists, public.opening_hours to authenticated;

create policy services_read on public.services for select to anon, authenticated using (active or public.is_owner());
create policy services_owner on public.services for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy stylists_read on public.stylists for select to anon, authenticated using (active or public.is_owner());
create policy stylists_owner on public.stylists for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy hours_read on public.opening_hours for select to anon, authenticated using (true);
create policy hours_owner on public.opening_hours for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Ραντεβού: ο επισκέπτης ΔΕΝ έχει κανένα δικαίωμα πάνω στον πίνακα. Έχει ονόματα και τηλέφωνα.
revoke all on public.appointments from anon;
grant select, insert, update on public.appointments to authenticated;
create policy appointments_owner on public.appointments for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Ο επισκέπτης μαθαίνει μόνο ΠΟΤΕ είναι πιασμένος ένας κομμωτής, όχι από ποιον.
-- security definer = η συνάρτηση τρέχει με τα δικαιώματα αυτού που την έφτιαξε, όχι του επισκέπτη.
create function public.busy_slots(p_stylist uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.stylist_id = p_stylist
    and a.status in ('confirmed', 'done')
    and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_from, p_to, '[)')
  order by a.starts_at;
$$;

-- Η κράτηση. Ο πελάτης στέλνει ΤΙ διάλεξε. Τη διάρκεια και την προκαταβολή τις βάζει η βάση
-- από τον τιμοκατάλογο, ώστε κανείς να μη στείλει «balayage 5 λεπτών με προκαταβολή 0».
create function public.book_appointment(p_service uuid, p_stylist uuid, p_starts_at timestamptz, p_name text, p_phone text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_service public.services;
  v_local timestamp := p_starts_at at time zone 'Europe/Athens';
  v_hours public.opening_hours;
  v_id uuid;
begin
  select * into v_service from public.services where id = p_service and active;
  if not found then
    raise exception 'unknown service' using errcode = 'KP001';
  end if;
  if not exists (select 1 from public.stylists where id = p_stylist and active) then
    raise exception 'unknown stylist' using errcode = 'KP001';
  end if;
  if p_starts_at <= now() then
    raise exception 'in the past' using errcode = 'KP002';
  end if;

  select * into v_hours from public.opening_hours where weekday = extract(dow from v_local);
  if not found
     or v_local::time < v_hours.open_time
     or v_local::time + make_interval(mins => v_service.duration_min) > v_hours.close_time then
    raise exception 'outside opening hours' using errcode = 'KP003';
  end if;

  insert into public.appointments (stylist_id, service_id, starts_at, ends_at, client_name, client_phone, deposit_cents)
  values (
    p_stylist, p_service, p_starts_at,
    p_starts_at + make_interval(mins => v_service.duration_min),
    p_name, p_phone,
    round(v_service.price_cents * v_service.deposit_rate)
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Στην Postgres κάθε νέα συνάρτηση μπορεί να την καλέσει ο καθένας. Το παίρνουμε πίσω και δίνουμε ρητά.
revoke execute on function public.busy_slots(uuid, timestamptz, timestamptz) from public;
revoke execute on function public.book_appointment(uuid, uuid, timestamptz, text, text) from public;
grant execute on function public.busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.book_appointment(uuid, uuid, timestamptz, text, text) to anon, authenticated;