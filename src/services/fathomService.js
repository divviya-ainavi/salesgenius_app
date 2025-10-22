import api from '@/lib/api';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { analytics } from '@/lib/analytics';

class FathomService {
  async getTranscripts(options = {}) {
    try {
      analytics.track('fathom_fetch_transcripts_started', {
        options: Object.keys(options),
      });

      const response = await api.get(API_ENDPOINTS.FATHOM.GET_TRANSCRIPTS, {
        limit: options.limit || 50,
        offset: options.offset || 0,
        date_from: options.dateFrom,
        date_to: options.dateTo,
        ...options,
      });

      const transformedData = this.transformFathomResponse(response.data);

      analytics.track('fathom_fetch_transcripts_completed', {
        transcripts_count: transformedData.length,
        successful_transcripts: transformedData.filter(t => t.success).length,
        failed_transcripts: transformedData.filter(t => !t.success).length,
      });

      return transformedData;
    } catch (error) {
      analytics.track('fathom_fetch_transcripts_failed', {
        error: error.message,
      });

      console.error('Error fetching Fathom transcripts:', error);
      throw error;
    }
  }

  async getTranscriptDetail(transcriptId) {
    try {
      analytics.track('fathom_fetch_transcript_detail_started', {
        transcript_id: transcriptId,
      });

      const response = await api.get(`${API_ENDPOINTS.FATHOM.GET_TRANSCRIPT_DETAIL}/${transcriptId}`);

      analytics.track('fathom_fetch_transcript_detail_completed', {
        transcript_id: transcriptId,
        has_transcript: !!response.data.transcript,
        has_summary: !!response.data.summary,
      });

      return response.data;
    } catch (error) {
      analytics.track('fathom_fetch_transcript_detail_failed', {
        transcript_id: transcriptId,
        error: error.message,
      });

      console.error('Error fetching Fathom transcript detail:', error);
      throw error;
    }
  }

  async syncTranscripts(options = {}) {
    try {
      analytics.track('fathom_sync_started', {
        sync_options: Object.keys(options),
      });

      const response = await api.get(API_ENDPOINTS.FATHOM.SYNC_TRANSCRIPTS);

      analytics.track('fathom_sync_completed', {
        synced_count: response.data.synced_count,
        new_transcripts: response.data.new_transcripts,
        updated_transcripts: response.data.updated_transcripts,
      });

      return response.data;
    } catch (error) {
      analytics.track('fathom_sync_failed', {
        error: error.message,
      });

      console.error('Error syncing Fathom transcripts:', error);
      throw error;
    }
  }

  transformFathomResponse(apiData) {
    if (!Array.isArray(apiData)) {
      console.warn('Fathom API response is not an array:', apiData);
      return [];
    }

    return apiData.map((item, index) => {
      if (!item.success || !item.data) {
        console.warn(`Fathom transcript ${index} failed or has no data:`, item);
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
          fathomSummary: 'Failed to load summary',
          transcript: 'Failed to load transcript',
          audioUrl: null,
          participants: [],
          meeting_link: null,
          organizer_email: null,
          error: item.error || 'Unknown error',
        };
      }

      const data = item.data;

      const { companyName, prospectName } = this.extractNamesFromFathomData(data);

      const formattedDate = this.formatFathomDate(data.dateString);

      const duration = this.calculateDuration(data);

      return {
        id: data.id,
        callId: data.title || `Call ${data.id}`,
        companyName,
        prospectName,
        date: formattedDate,
        duration,
        status: 'completed',
        hasTranscript: true,
        hasSummary: true,
        fathomSummary: this.generateSummaryFromFathomData(data),
        transcript: `[Fathom Call Recording]\n\nTitle: ${data.title}\nDate: ${formattedDate}\nParticipants: ${data.participants.join(', ')}\nMeeting Link: ${data.meeting_link}\n\n[Transcript content would be loaded from detailed API call]`,
        audioUrl: null,
        participants: data.participants || [],
        meeting_link: data.meeting_link,
        organizer_email: data.organizer_email,
        raw_data: data,
      };
    });
  }

  extractNamesFromFathomData(data) {
    let companyName = 'Unknown Company';
    let prospectName = 'Unknown Prospect';

    if (data.title) {
      const titlePatterns = [
        /^(.+?)\s*-\s*(.+)$/,
        /^(.+?)\s*:\s*(.+)$/,
        /^(.+?)\s+with\s+(.+)$/i,
        /^(.+?)\s+call\s*$/i,
      ];

      for (const pattern of titlePatterns) {
        const match = data.title.match(pattern);
        if (match) {
          companyName = match[1].trim();
          if (match[2]) {
            prospectName = match[2].trim();
          }
          break;
        }
      }

      if (companyName === 'Unknown Company') {
        companyName = data.title;
      }
    }

    if (data.participants && data.participants.length > 0) {
      const prospect = data.participants.find(p => p !== data.organizer_email);
      if (prospect) {
        const emailName = prospect.split('@')[0];
        prospectName = emailName.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    return { companyName, prospectName };
  }

  formatFathomDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting Fathom date:', dateString, error);
      return new Date().toISOString().split('T')[0];
    }
  }

  calculateDuration(data) {
    return 'Unknown Duration';
  }

  generateSummaryFromFathomData(data) {
    const participantsList = data.participants && data.participants.length > 0
      ? data.participants.join(', ')
      : 'No participants listed';

    return `Meeting Summary:
• Title: ${data.title}
• Date: ${this.formatFathomDate(data.dateString)}
• Organizer: ${data.organizer_email}
• Participants: ${participantsList}
• Meeting Link: ${data.meeting_link || 'Not available'}

Key Discussion Points:
• Meeting recorded via Fathom
• Detailed transcript and AI-generated insights available
• Follow-up actions to be determined from transcript analysis

Next Steps:
• Process transcript for detailed insights
• Generate action items and commitments
• Create personalized follow-up content

Note: This is a preliminary summary. Detailed analysis will be available after processing the full transcript.`;
  }

  async getConnectionStatus() {
    try {
      const response = await api.get('/fathom/status');
      return response.data;
    } catch (error) {
      console.error('Error checking Fathom connection:', error);
      return { connected: false, error: error.message };
    }
  }

  async getTranscriptById(fathomId) {
    const response = await api.get('/get-fathom-transcripts-byid', {
      id: fathomId,
    });
    return response.data[0];
  }

  validateFathomData(data) {
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

const fathomService = new FathomService();
export default fathomService;

export const {
  getTranscripts,
  getTranscriptDetail,
  syncTranscripts,
  getConnectionStatus,
  validateFathomData,
  getTranscriptById
} = fathomService;
