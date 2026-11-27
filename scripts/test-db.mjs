// Τρέχει τα migrations και τα τεστ pgTAP σε αληθινή Postgres μέσα στο Node (PGlite), χωρίς Docker.
// Ελέγχει τη SQL σου: πίνακες, κανόνες, συναρτήσεις. ΔΕΝ είναι το ίδιο το Supabase:
// οι ρόλοι του και το auth.jwt() στήνονται εδώ με το χέρι, όπως τα περιγράφει η τεκμηρίωσή του.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { pgtap } from '@electric-sql/pglite-pgtap';

const root = join(import.meta.dirname, '..', 'supabase');
const sqlFiles = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => join(root, dir, f));

// Ό,τι έχει ένα project του Supabase πριν τρέξει το πρώτο σου migration.
const SUPABASE_SHIM = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable
    as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  create extension pgtap;
  create schema storage;
    create table storage.buckets (
    id text primary key, name text not null, public boolean not null default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create publication supabase_realtime;
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text not null references storage.buckets (id),
    name text not null,
    created_at timestamptz not null default now(),
    unique (bucket_id, name)
  );
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on storage.objects to anon, authenticated, service_role;
`;

const db = new PGlite({ extensions: { btree_gist, pgtap } });
await db.exec(SUPABASE_SHIM);
for (const file of sqlFiles('migrations')) {
  await db.exec(readFileSync(file, 'utf8'));
}

let failed = 0;
for (const file of sqlFiles('tests/database')) {
  console.log(`\n# ${file.slice(root.length + 1)}`);
  let lines = [];
  try {
    const results = await db.exec(readFileSync(file, 'utf8'));
    lines = results
      .flatMap((r) => r.rows.flatMap((row) => Object.values(row)))
      .filter((v) => typeof v === 'string');
  } catch (error) {
    lines = [`not ok - το αρχείο σταμάτησε: ${error.message}`];
    await db.exec('rollback');
  }
  for (const line of lines.flatMap((l) => l.split('\n'))) {
    console.log(line);
    if (/^not ok/.test(line) || /^# Looks like/.test(line)) {
      failed++;
    }
  }
}

console.log(failed ? `\n✗ ${failed} πρόβλημα(τα)` : '\n✓ όλα τα τεστ της βάσης πέρασαν');
process.exit(failed ? 1 : 0);
