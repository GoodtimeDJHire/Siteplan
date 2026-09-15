drop policy if exists "tender_files_owner_delete_storage" on storage.objects;
create policy "tender_files_owner_delete_storage"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'tender-files'
  and exists (
    select 1
    from public.tender_files tf
    join public.tenders t on t.id = tf.tender_id
    where tf.storage_path = storage.objects.name
      and t.owner_id = (select auth.uid())
  )
);

