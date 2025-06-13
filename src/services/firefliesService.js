import api from '@/lib/api';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { analytics } from '@/lib/analytics';

// Fireflies.ai Service for handling all Fireflies integrations
class FirefliesService {
  // Get all Fireflies transcripts
  async getTranscripts(options = {}) {
    try {
      analytics.track('fireflies_fetch_transcripts_started', {
        options: Object.keys(options),
      });

      const response = await api.get(API_ENDPOINTS.FIREFLIES.GET_TRANSCRIPTS, {
        limit: options.limit || 50,
        offset: options.offset || 0,
        date_from: options.dateFrom,
        date_to: options.dateTo,
        ...options,
      });

      // Transform the API response to match our expected format
      const transformedData = this.transformFirefliesResponse(response.data);

      analytics.track('fireflies_fetch_transcripts_completed', {
        transcripts_count: transformedData.length,
        successful_transcripts: transformedData.filter(t => t.success).length,
        failed_transcripts: transformedData.filter(t => !t.success).length,
      });

      return transformedData;
    } catch (error) {
      analytics.track('fireflies_fetch_transcripts_failed', {
        error: error.message,
      });
      
      console.error('Error fetching Fireflies transcripts:', error);
      throw error;
    }
  }

  // Get detailed transcript data
  async getTranscriptDetail(transcriptId) {
    try {
      analytics.track('fireflies_fetch_transcript_detail_started', {
        transcript_id: transcriptId,
      });

      const response = await api.get(`${API_ENDPOINTS.FIREFLIES.GET_TRANSCRIPT_DETAIL}/${transcriptId}`);

      analytics.track('fireflies_fetch_transcript_detail_completed', {
        transcript_id: transcriptId,
        has_transcript: !!response.data.transcript,
        has_summary: !!response.data.summary,
      });

      return response.data;
    } catch (error) {
      analytics.track('fireflies_fetch_transcript_detail_failed', {
        transcript_id: transcriptId,
        error: error.message,
      });
      
      console.error('Error fetching Fireflies transcript detail:', error);
      throw error;
    }
  }

  // Sync transcripts from Fireflies
  async syncTranscripts(options = {}) {
    try {
      analytics.track('fireflies_sync_started', {
        sync_options: Object.keys(options),
      });

      const response = await api.post(API_ENDPOINTS.FIREFLIES.SYNC_TRANSCRIPTS, {
        sync_options: {
          force_refresh: options.forceRefresh || false,
          date_range: options.dateRange || '7d',
          include_processed: options.includeProcessed !== false,
          ...options,
        },
        timestamp: new Date().toISOString(),
      });

      analytics.track('fireflies_sync_completed', {
        synced_count: response.data.synced_count,
        new_transcripts: response.data.new_transcripts,
        updated_transcripts: response.data.updated_transcripts,
      });

      return response.data;
    } catch (error) {
      analytics.track('fireflies_sync_failed', {
        error: error.message,
      });
      
      console.error('Error syncing Fireflies transcripts:', error);
      throw error;
    }
  }

  // Transform Fireflies API response to our expected format
  transformFirefliesResponse(apiData) {
    if (!Array.isArray(apiData)) {
      console.warn('Fireflies API response is not an array:', apiData);
      return [];
    }

    return apiData.map((item, index) => {
      // Handle both successful and failed responses
      if (!item.success || !item.data) {
        console.warn(`Fireflies transcript ${index} failed or has no data:`, item);
        return {
          id: `failed_${index}`,
          callId: `Failed Call ${index + 1}`,
          companyName: 'Unknown Company',
          prospectName: 'Unknown Prospect',
          date: new Date().toISOString().split('T')[0],
          duration: 'Unknown',
          status: 'failed',
          hasTranscript: false,
          hasSummary: false,
          firefliesSummary: 'Failed to load summary',
          transcript: 'Failed to load transcript',
          audioUrl: null,
          participants: [],
          meeting_link: null,
          organizer_email: null,
          error: item.error || 'Unknown error',
        };
      }

      const data = item.data;
      
      // Extract company and prospect names from participants or title
      const { companyName, prospectName } = this.extractNamesFromFirefliesData(data);
      
      // Format date
      const formattedDate = this.formatFirefliesDate(data.dateString);
      
      // Calculate duration (placeholder - would need actual duration from API)
      const duration = this.calculateDuration(data);

      return {
        id: data.id,
        callId: data.title || `Call ${data.id}`,
        companyName,
        prospectName,
        date: formattedDate,
        duration,
        status: 'completed',
        hasTranscript: true, // Assume Fireflies calls have transcripts
        hasSummary: true, // Assume Fireflies calls have summaries
        firefliesSummary: this.generateSummaryFromFirefliesData(data),
        transcript: `[Fireflies.ai Call Recording]\n\nTitle: ${data.title}\nDate: ${formattedDate}\nParticipants: ${data.participants.join(', ')}\nMeeting Link: ${data.meeting_link}\n\n[Transcript content would be loaded from detailed API call]`,
        audioUrl: null, // Would be provided by detailed API
        participants: data.participants || [],
        meeting_link: data.meeting_link,
        organizer_email: data.organizer_email,
        raw_data: data, // Store original data for reference
      };
    });
  }

  // Extract company and prospect names from Fireflies data
  extractNamesFromFirefliesData(data) {
    let companyName = 'Unknown Company';
    let prospectName = 'Unknown Prospect';

    // Try to extract from title
    if (data.title) {
      // Look for common patterns in meeting titles
      const titlePatterns = [
        /^(.+?)\s*-\s*(.+)$/, // "Company - Meeting Type"
        /^(.+?)\s*:\s*(.+)$/, // "Company: Meeting Type"
        /^(.+?)\s+with\s+(.+)$/i, // "Meeting with Company"
        /^(.+?)\s+call\s*$/i, // "Company call"
      ];

      for (const pattern of titlePatterns) {
        const match = data.title.match(pattern);
        if (match) {
          companyName = match[1].trim();
          if (match[2]) {
            // If there's a second part, it might contain prospect info
            prospectName = match[2].trim();
          }
          break;
        }
      }

      // If no pattern matched, use the title as company name
      if (companyName === 'Unknown Company') {
        companyName = data.title;
      }
    }

    // Try to extract prospect name from participants
    if (data.participants && data.participants.length > 0) {
      // Find the first participant that's not the organizer
      const prospect = data.participants.find(p => p !== data.organizer_email);
      if (prospect) {
        // Extract name from email (before @)
        const emailName = prospect.split('@')[0];
        prospectName = emailName.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    return { companyName, prospectName };
  }

  // Format Fireflies date string
  formatFirefliesDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      console.warn('Error formatting Fireflies date:', dateString, error);
      return new Date().toISOString().split('T')[0];
    }
  }

  // Calculate duration (placeholder - would need actual duration from API)
  calculateDuration(data) {
    // This is a placeholder - in reality, you'd get duration from the API
    // For now, we'll estimate based on meeting type or use a default
    if (data.title && data.title.toLowerCase().includes('sync')) {
      return '30 min';
    } else if (data.title && data.title.toLowerCase().includes('demo')) {
      return '45 min';
    } else {
      return '25 min'; // Default duration
    }
  }

  // Generate summary from Fireflies data
  generateSummaryFromFirefliesData(data) {
    const participantsList = data.participants && data.participants.length > 0 
      ? data.participants.join(', ') 
      : 'No participants listed';

    return `Meeting Summary:
• Title: ${data.title}
• Date: ${this.formatFirefliesDate(data.dateString)}
• Organizer: ${data.organizer_email}
• Participants: ${participantsList}
• Meeting Link: ${data.meeting_link || 'Not available'}

Key Discussion Points:
• Meeting recorded via Fireflies.ai
• Detailed transcript and AI-generated insights available
• Follow-up actions to be determined from transcript analysis

Next Steps:
• Process transcript for detailed insights
• Generate action items and commitments
• Create personalized follow-up content

Note: This is a preliminary summary. Detailed analysis will be available after processing the full transcript.`;
  }

  // Check Fireflies connection status
  async getConnectionStatus() {
    try {
      const response = await api.get('/fireflies/status');
      return response.data;
    } catch (error) {
      console.error('Error checking Fireflies connection:', error);
      return { connected: false, error: error.message };
    }
  }

  // Validate Fireflies data
  validateFirefliesData(data) {
    const errors = [];

    if (!data.id) {
      errors.push('Missing transcript ID');
    }

    if (!data.title) {
      errors.push('Missing meeting title');
    }

    if (!data.dateString) {
      errors.push('Missing meeting date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create and export singleton instance
const firefliesService = new FirefliesService();
export default firefliesService;

// Export individual methods for convenience
export const {
  getTranscripts,
  getTranscriptDetail,
  syncTranscripts,
  getConnectionStatus,
  validateFirefliesData,
} = firefliesService;