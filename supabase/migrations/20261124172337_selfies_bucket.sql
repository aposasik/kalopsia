
-- Βήμα 5: ο κάδος (bucket) με τις φωτογραφίες των αιτημάτων.
-- public = false: κανένα αρχείο δεν ανοίγει με σκέτο link.
insert into storage.buckets (id, name, public) values ('selfies', 'selfies', false);

-- Ο καθένας ανεβάζει, αλλά μόνο στον κάδο selfies και μόνο με όνομα «uuid.jpg».
create policy selfies_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'selfies' and name ~ '^[0-9a-f-]{36}\.jpg$');

-- Μόνο ο ιδιοκτήτης βλέπει και σβήνει φωτογραφίες. Ο πελάτης δεν ξαναδιαβάζει ούτε τη δική του.
create policy selfies_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and public.is_owner());
create policy selfies_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'selfies' and public.is_owner());