import api from '@/lib/api';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { analytics } from '@/lib/analytics';

// File Service for handling all file operations
class FileService {
  // Upload file with progress tracking
  async uploadFile(file, options = {}) {
    try {
      analytics.trackFileUpload(file.name, file.size, file.type, 'started');

      const additionalData = {
        user_id: options.userId,
        file_type: file.type,
        original_name: file.name,
        ...options.metadata,
      };

      const response = await api.upload(
        API_ENDPOINTS.FILES.UPLOAD,
        file,
        additionalData,
        options.onProgress
      );

      analytics.trackFileUpload(file.name, file.size, file.type, 'completed');

      return response.data;
    } catch (error) {
      analytics.trackFileUpload(file.name, file.size, file.type, 'failed');
      throw error;
    }
  }

  // Process uploaded file (transcript analysis)
  async processFile(fileId, options = {}) {
    try {
      const response = await api.post(API_ENDPOINTS.FILES.PROCESS, {
        file_id: fileId,
        processing_options: {
          extract_insights: options.extractInsights !== false,
          generate_summary: options.generateSummary !== false,
          analyze_communication: options.analyzeCommunication !== false,
          create_action_items: options.createActionItems !== false,
          ...options,
        },
        timestamp: new Date().toISOString(),
      });

      analytics.track('file_processing_started', {
        file_id: fileId,
        processing_options: Object.keys(options),
      });

      return response.data;
    } catch (error) {
      analytics.track('file_processing_failed', {
        file_id: fileId,
        error: error.message,
      });
      throw error;
    }
  }

  // Get file list
  async getFiles(params = {}) {
    try {
      const response = await api.get(API_ENDPOINTS.FILES.LIST, {
        limit: params.limit || 20,
        offset: params.offset || 0,
        file_type: params.fileType,
        status: params.status,
        sort_by: params.sortBy || 'created_at',
        sort_order: params.sortOrder || 'desc',
        ...params,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(fileId, options = {}) {
    try {
      const response = await api.get(`${API_ENDPOINTS.FILES.DOWNLOAD}/${fileId}`, {}, {
        headers: {
          'Accept': options.format || 'application/octet-stream',
        },
      });

      analytics.track('file_downloaded', {
        file_id: fileId,
        format: options.format,
      });

      return response.data;
    } catch (error) {
      analytics.track('file_download_failed', {
        file_id: fileId,
        error: error.message,
      });
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId) {
    try {
      const response = await api.delete(`${API_ENDPOINTS.FILES.DELETE}/${fileId}`);

      analytics.track('file_deleted', {
        file_id: fileId,
      });

      return response.data;
    } catch (error) {
      analytics.track('file_deletion_failed', {
        file_id: fileId,
        error: error.message,
      });
      throw error;
    }
  }

  // Analyze transcript
  async analyzeTranscript(transcriptData, options = {}) {
    try {
      const response = await api.post(API_ENDPOINTS.FILES.TRANSCRIPT_ANALYSIS, {
        transcript: transcriptData,
        analysis_options: {
          extract_insights: options.extractInsights !== false,
          identify_speakers: options.identifySpeakers !== false,
          analyze_sentiment: options.analyzeSentiment !== false,
          extract_action_items: options.extractActionItems !== false,
          generate_summary: options.generateSummary !== false,
          ...options,
        },
        timestamp: new Date().toISOString(),
      });

      analytics.track('transcript_analysis_completed', {
        transcript_length: transcriptData.length,
        analysis_options: Object.keys(options),
        insights_count: response.data.insights?.length || 0,
      });

      return response.data;
    } catch (error) {
      analytics.track('transcript_analysis_failed', {
        error: error.message,
      });
      throw error;
    }
  }

  // Batch file operations
  async batchOperation(operation, fileIds, options = {}) {
    try {
      const requests = fileIds.map(fileId => ({
        method: operation === 'delete' ? 'DELETE' : 'POST',
        endpoint: operation === 'delete' 
          ? `${API_ENDPOINTS.FILES.DELETE}/${fileId}`
          : `${API_ENDPOINTS.FILES.PROCESS}/${fileId}`,
        body: operation !== 'delete' ? options : undefined,
      }));

      const response = await api.batch(requests);

      analytics.track('file_batch_operation', {
        operation,
        file_count: fileIds.length,
        successful_operations: response.filter(r => r.success).length,
        failed_operations: response.filter(r => !r.success).length,
      });

      return response;
    } catch (error) {
      analytics.track('file_batch_operation_failed', {
        operation,
        file_count: fileIds.length,
        error: error.message,
      });
      throw error;
    }
  }

  // Get file processing status
  async getProcessingStatus(fileId) {
    try {
      const response = await api.get(`${API_ENDPOINTS.FILES.PROCESS}/${fileId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting processing status:', error);
      throw error;
    }
  }

  // Validate file before upload
  validateFile(file, options = {}) {
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options.allowedTypes || [
      'text/plain',
      'text/vtt',
      'application/pdf',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
    ];

    const errors = [];

    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create and export singleton instance
const fileService = new FileService();
export default fileService;

// Export individual methods for convenience
export const {
  uploadFile,
  processFile,
  getFiles,
  downloadFile,
  deleteFile,
  analyzeTranscript,
  batchOperation,
  getProcessingStatus,
  validateFile,
} = fileService;