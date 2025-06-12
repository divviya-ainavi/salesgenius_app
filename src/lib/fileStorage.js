// File storage utilities for handling file uploads and generating shareable links
import { supabase } from './supabase'

export const fileStorage = {
  // Upload file to Supabase Storage and return shareable URL
  async uploadFile(file, userId) {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${userId}/${timestamp}_${file.name}`
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('call-transcripts')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('call-transcripts')
        .getPublicUrl(uniqueFileName)

      return {
        filePath: data.path,
        publicUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  },

  // Get shareable URL for existing file
  async getFileUrl(filePath) {
    try {
      const { data } = supabase.storage
        .from('call-transcripts')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error getting file URL:', error)
      throw new Error(`Failed to get file URL: ${error.message}`)
    }
  },

  // Download file content for processing (for text files)
  async downloadFileContent(publicUrl) {
    try {
      const response = await fetch(publicUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type')
      
      // For text files, return text content
      if (contentType && (contentType.includes('text/') || contentType.includes('application/json'))) {
        return await response.text()
      }
      
      // For other files (like PDFs), return null - they'll be processed differently
      return null
    } catch (error) {
      console.error('Error downloading file content:', error)
      throw new Error(`Failed to download file content: ${error.message}`)
    }
  },

  // Delete file from storage
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('call-transcripts')
        .remove([filePath])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  },

  // Create shareable link with expiration (for sensitive files)
  async createSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from('call-transcripts')
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        throw error
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error creating signed URL:', error)
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }
  }
}