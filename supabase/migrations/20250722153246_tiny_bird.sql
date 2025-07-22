@@ .. @@
 /*
   # Business Knowledge Files Management
 
   1. New Tables
     - `business_knowledge_files`
       - `id` (uuid, primary key)
       - `organization_id` (uuid, foreign key to organizations)
       - `uploaded_by` (uuid, foreign key to profiles)
       - `filename` (text, storage filename)
       - `original_filename` (text, user-friendly filename)
       - `file_size` (bigint)
       - `content_type` (text)
       - `storage_path` (text, path in Supabase Storage)
       - `file_url` (text, public URL)
       - `description` (text, optional)
       - `created_at` (timestamptz)
       - `updated_at` (timestamptz)
 
   2. Security
     - Enable RLS on `business_knowledge_files` table
     - Add policies for org admins to manage files
     - Add policy for organization members to read files
 
   3. Storage
     - Create storage bucket for business knowledge files
     - Set appropriate policies for file access
 */

+-- Create storage bucket for business knowledge files
+INSERT INTO storage.buckets (id, name, public)
+VALUES ('business-knowledge', 'business-knowledge', true)
+ON CONFLICT (id) DO NOTHING;
+
+-- Set storage policies
+CREATE POLICY "Org admins can upload business knowledge files"
+ON storage.objects FOR INSERT
+TO authenticated
+WITH CHECK (
+  bucket_id = 'business-knowledge' AND
+  (storage.foldername(name))[1] IN (
+    SELECT profiles.organization_id::text
+    FROM profiles
+    WHERE profiles.id = auth.uid()
+    AND profiles.title_id IN (
+      SELECT titles.id
+      FROM titles
+      WHERE titles.role_id = 2
+    )
+  )
+);
+
+CREATE POLICY "Org admins can delete business knowledge files"
+ON storage.objects FOR DELETE
+TO authenticated
+USING (
+  bucket_id = 'business-knowledge' AND
+  (storage.foldername(name))[1] IN (
+    SELECT profiles.organization_id::text
+    FROM profiles
+    WHERE profiles.id = auth.uid()
+    AND profiles.title_id IN (
+      SELECT titles.id
+      FROM titles
+      WHERE titles.role_id = 2
+    )
+  )
+);
+
+CREATE POLICY "Organization members can view business knowledge files"
+ON storage.objects FOR SELECT
+TO authenticated
+USING (
+  bucket_id = 'business-knowledge' AND
+  (storage.foldername(name))[1] IN (
+    SELECT profiles.organization_id::text
+    FROM profiles
+    WHERE profiles.id = auth.uid()
+  )
+);
+
 -- Create business_knowledge_files table
 CREATE TABLE IF NOT EXISTS business_knowledge_files (