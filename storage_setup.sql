-- Enable storage if not already enabled (this is usually enabled by default on new projects)
-- insert into storage.buckets (id, name, public) values ('project-thumbnails', 'project-thumbnails', true);

-- Note: You might need to create the bucket manually in the Supabase Dashboard if you don't have permissions to run this SQL for storage.
-- Go to Storage -> New Bucket -> Name: 'project-thumbnails' -> Public bucket: Checked

-- Policies (Run these in the SQL Editor)

-- 1. Allow public access to view files
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'project-thumbnails' );

-- 2. Allow authenticated users to upload files
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'project-thumbnails' );

-- 3. Allow users to update their own files (optional, good for editing)
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'project-thumbnails' );
