-- Storage RLS policies for 'avatars' bucket to allow document uploads
-- Allows authenticated users to upload files under their user ID paths

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can upload their own files (avatars)" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files (avatars)" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;

-- INSERT policy: allow creating objects in the avatars bucket within the user's own folder
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'documents'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- UPDATE policy: allow users to update/overwrite their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'documents'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'documents'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- SELECT policy: public read for avatars bucket
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');