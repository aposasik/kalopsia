begin;
select plan(10);

insert into public.services (id, name, price_cents, duration_min, by_request) values
  ('00000000-0000-0000-0000-000000000001', 'Κούρεμα', 2000, 30, false),
  ('00000000-0000-0000-0000-000000000003', 'Balayage', 9000, 180, true);

-- ── Ο επισκέπτης στέλνει αίτημα ────────────────────────────────────────────
set local role anon;

select lives_ok(
  $$ select public.create_request('00000000-0000-0000-0000-000000000003', 'Θέλω ξανθές ανταύγειες', 'Πέμπτη πρωί', 'viber',
       'Άννα Δοκιμή', '6900000001', '11111111-1111-1111-1111-111111111111.jpg', true) $$,
  'με συγκατάθεση το αίτημα γράφεται');

select throws_ok(
  $$ select public.create_request('00000000-0000-0000-0000-000000000003', 'Θέλω ξανθές ανταύγειες', '', 'viber',
       'Άννα Δοκιμή', '6900000001', '11111111-1111-1111-1111-111111111111.jpg', false) $$,
  'KP010', null, 'χωρίς συγκατάθεση απορρίπτεται');

select throws_ok(
  $$ select public.create_request('00000000-0000-0000-0000-000000000001', 'Θέλω ένα κούρεμα', '', 'viber',
       'Άννα Δοκιμή', '6900000001', '11111111-1111-1111-1111-111111111111.jpg', true) $$,
  'KP001', null, 'το κούρεμα κλείνεται κατευθείαν, δεν δέχεται αίτημα');

select throws_ok(
  $$ select public.create_request('00000000-0000-0000-0000-000000000003', 'Θέλω ξανθές ανταύγειες', '', 'viber',
       'Άννα Δοκιμή', '6900000001', '../../etc/passwd', true) $$,
  'KP011', null, 'όνομα αρχείου που δεν είναι uuid.jpg απορρίπτεται');

select throws_ok('select count(*) from public.requests', '42501', null,
  'ο επισκέπτης δεν διαβάζει τα αιτήματα');

-- ── Ο κάδος με τις φωτογραφίες ────────────────────────────────────────────
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('selfies', '11111111-1111-1111-1111-111111111111.jpg') $$,
  'ανεβάζει φωτογραφία με όνομα uuid.jpg');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('selfies', 'virus.exe') $$,
  '42501', null, 'άλλο όνομα αρχείου απορρίπτεται');

select is(
  (select count(*)::int from storage.objects), 0,
  'δεν βλέπει καμία φωτογραφία, ούτε αυτήν που μόλις ανέβασε');

-- ── Ο ιδιοκτήτης ──────────────────────────────────────────────────────────
reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-0000000000aa", "app_metadata": {"role": "owner"}}';

select results_eq(
  $$ select wish, channel, status, consent_at is not null from public.requests $$,
  $$ values ('Θέλω ξανθές ανταύγειες', 'viber', 'new', true) $$,
  'ο ιδιοκτήτης βλέπει το αίτημα, με την ώρα της συγκατάθεσης');

select is(
  (select count(*)::int from storage.objects where bucket_id = 'selfies'), 1,
  'και τη φωτογραφία');

reset role;
select * from finish();
rollback;