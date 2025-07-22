import { supabase } from './supabase';
import { analytics } from './analytics';
import { CURRENT_USER } from './supabase';

// Business Knowledge Service for handling file operations
class BusinessKnowledgeService {
  // Upload file to Supabase Storage and save metadata to database
  async uploadFile(file, organizationId, uploadedBy, description = '') {
    try {
      console.log('🚀 Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        organizationId,
        uploadedBy,
        currentUser: CURRENT_USER
      });

      // Validate inputs
      if (!organizationId) {
        throw new Error('Organization ID is required for file upload');
      }
      if (!uploadedBy) {
        throw new Error('User ID is required for file upload');
      }

      analytics.track('business_knowledge_upload_started', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        organization_id: organizationId,
      });

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${organizationId}/${timestamp}_${sanitizedFileName}`;
      
      console.log('📁 Generated unique filename:', uniqueFileName);

      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('📦 Available buckets:', buckets?.map(b => b.name));
      
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError);
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'business-knowledge');
      if (!bucketExists) {
        console.error('❌ business-knowledge bucket does not exist');
        throw new Error('Storage bucket not configured. Please contact administrator.');
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-knowledge')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      console.log('✅ File uploaded to storage successfully:', uploadData);

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('business-knowledge')
        .getPublicUrl(uniqueFileName);

      console.log('🔗 Generated public URL:', urlData.publicUrl);

      // Save file metadata to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('business_knowledge_files')
        .insert([{
          organization_id: organizationId,
          uploaded_by: uploadedBy,
          filename: uniqueFileName,
          original_filename: file.name,
          file_size: file.size,
          content_type: file.type,
          storage_path: uploadData.path,
          file_url: urlData.publicUrl,
          description: description
        }])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        // If database insert fails, clean up the uploaded file
        try {
          await supabase.storage
            .from('business-knowledge')
            .remove([uniqueFileName]);
          console.log('🧹 Cleaned up uploaded file after database error');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup uploaded file:', cleanupError);
        }
         
        throw new Error(`Database save failed: ${dbError.message}`);
      }

      console.log('💾 File metadata saved to database:', fileRecord);

      analytics.track('business_knowledge_upload_completed', {
        file_id: fileRecord.id,
        file_name: file.name,
        file_size: file.size,
        organization_id: organizationId,
      });

      return fileRecord;
    } catch (error) {
      analytics.track('business_knowledge_upload_failed', {
        file_name: file.name,
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error uploading business knowledge file:', error);
      throw error;
    }
  }

  // Get all files for an organization
  async getFiles(organizationId, params = {}) {
    try {
      console.log('📋 Fetching files for organization:', organizationId);

      if (!organizationId) {
        console.warn('⚠️ No organization ID provided');
        return [];
      }

      let query = supabase
        .from('business_knowledge_files')
        .select(`
          *,
          uploader:profiles!business_knowledge_files_uploaded_by_fkey(full_name, email)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Apply pagination if provided
      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching files:', error);
        throw new Error(`Failed to fetch files: ${error.message}`);
      }

      console.log('📄 Fetched files from database:', data);

      analytics.track('business_knowledge_files_fetched', {
        organization_id: organizationId,
        files_count: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      analytics.track('business_knowledge_files_fetch_failed', {
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error fetching business knowledge files:', error);
      throw error;
    }
  }

  // Delete file (both from storage and database)
  async deleteFile(fileId, organizationId) {
    try {
      console.log('🗑️ Deleting file:', { fileId, organizationId });

      // First, get the file record to get the storage path
      const { data: fileRecord, error: fetchError } = await supabase
        .from('business_knowledge_files')
        .select('storage_path, filename, original_filename')
        .eq('id', fileId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError || !fileRecord) {
        throw new Error('File not found or access denied');
      }

      console.log('📁 File record found:', fileRecord);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('business-knowledge')
        .remove([fileRecord.storage_path]);

      if (storageError) {
        console.warn('⚠️ Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log('🗑️ File deleted from storage successfully');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('business_knowledge_files')
        .delete()
        .eq('id', fileId)
        .eq('organization_id', organizationId);

      if (dbError) {
        console.error('❌ Database deletion error:', dbError);
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      console.log('✅ File deleted successfully');

      analytics.track('business_knowledge_file_deleted', {
        file_id: fileId,
        file_name: fileRecord.original_filename,
        organization_id: organizationId,
      });

      return true;
    } catch (error) {
      analytics.track('business_knowledge_file_deletion_failed', {
        file_id: fileId,
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error deleting business knowledge file:', error);
      throw error;
    }
  }

  // Get file download URL (for private files)
  async getDownloadUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from('business-knowledge')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating download URL:', error);
      throw error;
    }
  }

  // Update file description
  async updateFileDescription(fileId, organizationId, description) {
    try {
      const { data, error } = await supabase
        .from('business_knowledge_files')
        .update({ description })
        .eq('id', fileId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update file description: ${error.message}`);
      }

      analytics.track('business_knowledge_file_updated', {
        file_id: fileId,
        organization_id: organizationId,
      });

      return data;
    } catch (error) {
      analytics.track('business_knowledge_file_update_failed', {
        file_id: fileId,
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error updating file description:', error);
      throw error;
    }
  }

  // Validate file before upload
  validateFile(file, options = {}) {
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options.allowedTypes || [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    const errors = [];

    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed. Allowed types: PDF, Word, Excel, PowerPoint, Text, Markdown`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create and export singleton instance
const businessKnowledgeService = new BusinessKnowledgeService();
export default businessKnowledgeService;

// Export individual methods for convenience
export const {
  uploadFile,
  getFiles,
  deleteFile,
  getDownloadUrl,
  updateFileDescription,
  validateFile,
} = businessKnowledgeService;