begin;
select plan(14);

-- Δεδομένα του τεστ. Το rollback στο τέλος τα σβήνει όλα.
insert into public.services (id, name, price_cents, duration_min) values
  ('00000000-0000-0000-0000-000000000001', 'Κούρεμα', 2000, 30),
  ('00000000-0000-0000-0000-000000000002', 'Βαφή', 4500, 90);
insert into public.stylists (id, name) values
  ('00000000-0000-0000-0000-000000000011', 'Μαρία'),
  ('00000000-0000-0000-0000-000000000012', 'Νίκος');
insert into public.opening_hours (weekday, open_time, close_time)
select d, '10:00', '18:00' from generate_series(2, 6) as d;

-- Η Μαρία έχει ραντεβού την Τρίτη 8/1/2030, 12:00–13:00 ώρα Ελλάδας (+02 τον χειμώνα).
insert into public.appointments (stylist_id, service_id, starts_at, ends_at, client_name, client_phone)
values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
        '2030-01-08 12:00+02', '2030-01-08 13:00+02', 'Άννα Δοκιμή', '6900000001');

-- ── Ο κανόνας της διπλοκράτησης ────────────────────────────────────────────
select throws_ok(
  $$ insert into public.appointments (stylist_id, service_id, starts_at, ends_at, client_name, client_phone)
     values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
             '2030-01-08 12:30+02', '2030-01-08 13:30+02', 'Βάσω Δοκιμή', '6900000002') $$,
  '23P01', null, 'ίδιος κομμωτής, ώρες που πατάνε η μία στην άλλη: η βάση αρνείται');

select lives_ok(
  $$ insert into public.appointments (stylist_id, service_id, starts_at, ends_at, client_name, client_phone)
     values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
             '2030-01-08 13:00+02', '2030-01-08 13:30+02', 'Βάσω Δοκιμή', '6900000002') $$,
  'το ένα τελειώνει 13:00, το άλλο αρχίζει 13:00: χωράνε');

select lives_ok(
  $$ insert into public.appointments (stylist_id, service_id, starts_at, ends_at, client_name, client_phone)
     values ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001',
             '2030-01-08 12:00+02', '2030-01-08 13:00+02', 'Γιώτα Δοκιμή', '6900000003') $$,
  'ίδια ώρα σε άλλον κομμωτή: χωράει');

update public.appointments set status = 'cancelled' where client_name = 'Άννα Δοκιμή';
select lives_ok(
  $$ insert into public.appointments (stylist_id, service_id, starts_at, ends_at, client_name, client_phone)
     values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
             '2030-01-08 12:00+02', '2030-01-08 13:00+02', 'Δώρα Δοκιμή', '6900000004') $$,
  'το ακυρωμένο ελευθερώνει την ώρα του');

-- ── Ο επισκέπτης (anon) ───────────────────────────────────────────────────
set local role anon;

select throws_ok('select count(*) from public.appointments', '42501', null,
  'ο επισκέπτης δεν διαβάζει τον πίνακα με τα ονόματα και τα τηλέφωνα');

select results_eq(
  $$ select to_char(starts_at at time zone 'Europe/Athens', 'HH24:MI'), to_char(ends_at at time zone 'Europe/Athens', 'HH24:MI')
     from public.busy_slots('00000000-0000-0000-0000-000000000011', '2030-01-08 00:00+02', '2030-01-09 00:00+02') $$,
  $$ values ('12:00', '13:00'), ('13:00', '13:30') $$,
  'μαθαίνει μόνο πότε είναι πιασμένη η Μαρία');

select is(
  (select count(*)::int from public.services), 2,
  'διαβάζει τον τιμοκατάλογο');

select throws_ok(
  $$ insert into public.services (name, price_cents, duration_min) values ('Δωρεάν', 0, 10) $$,
  '42501', null, 'δεν αλλάζει τον τιμοκατάλογο');

select lives_ok(
  $$ select public.book_appointment('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012',
                                    '2030-01-08 14:00+02', 'Ελένη Δοκιμή', '6900000005') $$,
  'κλείνει βαφή στον Νίκο, Τρίτη 14:00');

select throws_ok(
  $$ select public.book_appointment('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012',
                                    '2030-01-08 15:00+02', 'Ζωή Δοκιμή', '6900000006') $$,
  '23P01', null, 'η βαφή κρατά ως τις 15:30: κούρεμα στις 15:00 στον Νίκο απορρίπτεται');

select throws_ok(
  $$ select public.book_appointment('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012',
                                    '2030-01-06 12:00+02', 'Ζωή Δοκιμή', '6900000006') $$,
  'KP003', null, 'Κυριακή: κλειστά');

select throws_ok(
  $$ select public.book_appointment('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012',
                                    '2030-01-09 17:00+02', 'Ζωή Δοκιμή', '6900000006') $$,
  'KP003', null, 'βαφή 90 λεπτών στις 17:00 θα τελείωνε μετά το κλείσιμο');

-- ── Ο ιδιοκτήτης και ο απλός συνδεδεμένος ──────────────────────────────────
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-0000000000aa", "app_metadata": {"role": "owner"}}';

select results_eq(
  $$ select ends_at - starts_at, deposit_cents from public.appointments where client_name = 'Ελένη Δοκιμή' $$,
  $$ values (interval '90 minutes', 1350) $$,
  'ο ιδιοκτήτης βλέπει την κράτηση· διάρκεια και προκαταβολή τις έβαλε η βάση');

set local "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-0000000000bb"}';
select is(
  (select count(*)::int from public.appointments), 0,
  'συνδεδεμένος που δεν είναι ιδιοκτήτης δεν βλέπει κανένα ραντεβού');

reset role;
select * from finish();
rollback;