ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow authenticated users to upload chat images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "Allow public to view chat images" ON storage.objects;
CREATE POLICY "Allow public to view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

DROP POLICY IF EXISTS "Allow users to delete own chat images" ON storage.objects;
CREATE POLICY "Allow users to delete own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);
