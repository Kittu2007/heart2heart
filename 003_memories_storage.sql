-- Create a bucket for memories if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files to the 'memories' bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'memories');

-- Policy to allow public access to files in the 'memories' bucket
CREATE POLICY "Allow public select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'memories');

-- Policy to allow users to delete their own uploads
CREATE POLICY "Allow individual delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'memories' AND auth.uid() = owner);
