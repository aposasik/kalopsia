create extension if not exists btree_gist;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents integer not null check (price_cents >= 0),       -- €20 = 2000, όπως στον πυρήνα
  duration_min integer not null check (duration_min > 0),
  deposit_rate numeric(4,2) not null default 0.30 check (deposit_rate between 0 and 1),
  active boolean not null default true
);

create table public.stylists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true
);

-- Το ωράριο του μαγαζιού. weekday όπως το getDay() της JavaScript: 0 = Κυριακή.
-- Μέρα χωρίς γραμμή = κλειστά.
create table public.opening_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  open_time time not null,
  close_time time not null check (close_time > open_time)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists (id),
  service_id uuid not null references public.services (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'no_show', 'done')),
  client_name text not null check (length(trim(client_name)) >= 2),
  client_phone text not null check (length(trim(client_phone)) >= 10),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  created_at timestamptz not null default now(),
  -- Ο κανόνας της διπλοκράτησης: ίδιος κομμωτής (=) και διαστήματα που έχουν κοινή στιγμή (&&)
  -- δεν χωράνε μαζί. Το '[)' είναι το δικό σου Interval: η αρχή μέσα, το τέλος έξω.
  -- Τα ακυρωμένα δεν μετράνε: η ώρα τους ελευθερώνεται.
  constraint appointments_no_overlap exclude using gist (
    stylist_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('confirmed', 'done'))
);