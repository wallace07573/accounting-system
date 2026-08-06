-- Add image_url column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create product_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product_images', 'product_images', true) 
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the new bucket
-- 1. Public can read images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product_images');

-- 2. Authenticated users can upload images
DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product_images' AND auth.role() = 'authenticated');

-- 3. Authenticated users can update images
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'product_images' AND auth.role() = 'authenticated');

-- 4. Authenticated users can delete images
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product_images' AND auth.role() = 'authenticated');
