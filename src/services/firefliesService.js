import api from '@/lib/api';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { analytics } from '@/lib/analytics';

// Fireflies.ai Service for handling all Fireflies integrations
class FirefliesService {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.mockData = this.generateMockFirefliesData();
  }

  // Generate mock data for development/testing
  generateMockFirefliesData() {
    return [
      {
        success: true,
        data: {
          id: 'ff_001',
          title: 'Sales Discovery Call - TechCorp Solutions',
          dateString: '2024-01-15T14:30:00Z',
          participants: ['john.doe@techcorp.com', 'sales@company.com'],
          organizer_email: 'sales@company.com',
          meeting_link: 'https://zoom.us/j/123456789',
        }
      },
      {
        success: true,
        data: {
          id: 'ff_002',
          title: 'Product Demo - InnovateCorp',
          dateString: '2024-01-12T10:00:00Z',
          participants: ['sarah.smith@innovatecorp.com', 'demo@company.com'],
          organizer_email: 'demo@company.com',
          meeting_link: 'https://meet.google.com/abc-defg-hij',
        }
      },
      {
        success: true,
        data: {
          id: 'ff_003',
          title: 'Follow-up Discussion - StartupXYZ',
          dateString: '2024-01-10T16:15:00Z',
          participants: ['mike.johnson@startupxyz.com', 'followup@company.com'],
          organizer_email: 'followup@company.com',
          meeting_link: 'https://teams.microsoft.com/l/meetup-join/xyz',
        }
      }
    ];
  }

  // Check if API is available
  async checkApiAvailability() {
    try {
      // Try a simple health check or lightweight endpoint
      const response = await fetch(`${api.config.getBaseURL()}health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('API health check failed:', error.message);
      return false;
    }
  }

  // Get all Fireflies transcripts
  async getTranscripts(options = {}) {
    try {
      analytics.track('fireflies_fetch_transcripts_started', {
        options: Object.keys(options),
      });

      // Check if we're in development or if API is unavailable
      const isApiAvailable = await this.checkApiAvailability();
      
      if (this.isDevelopment && !isApiAvailable) {
        console.warn('API not available in development, using mock data');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const transformedData = this.transformFirefliesResponse(this.mockData);
        
        analytics.track('fireflies_fetch_transcripts_completed', {
          transcripts_count: transformedData.length,
          successful_transcripts: transformedData.filter(t => t.success).length,
          failed_transcripts: transformedData.filter(t => !t.success).length,
          source: 'mock_data',
        });

        return transformedData;
      }

      // Try to make the actual API call
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
        source: 'api',
      });

      return transformedData;
    } catch (error) {
      analytics.track('fireflies_fetch_transcripts_failed', {
        error: error.message,
      });
      
      console.error('Error fetching Fireflies transcripts:', error);
      
      // If it's a network error and we're in development, fall back to mock data
      if (this.isDevelopment && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('Network error in development, falling back to mock data');
        return this.transformFirefliesResponse(this.mockData);
      }
      
      // Re-throw the error for production or non-network errors
      throw new Error(`Failed to load Fireflies transcripts: ${error.message}`);
    }
  }

  // Get detailed transcript data
  async getTranscriptDetail(transcriptId) {
    try {
      analytics.track('fireflies_fetch_transcript_detail_started', {
        transcript_id: transcriptId,
      });

      // Check if we're using mock data
      const isApiAvailable = await this.checkApiAvailability();
      
      if (this.isDevelopment && !isApiAvailable) {
        // Return mock transcript detail
        const mockDetail = {
          id: transcriptId,
          transcript: `[Mock Transcript for ${transcriptId}]\n\n[00:00] Participant 1: Thank you for joining today's call...\n[00:15] Participant 2: Happy to be here. Let's discuss our requirements...\n[01:30] Participant 1: Based on what you've shared, I think our solution could be a great fit...\n\n[Continue with detailed mock transcript...]`,
          summary: `Mock summary for transcript ${transcriptId}. This call covered key discussion points about requirements, solution fit, and next steps.`,
          duration: 1800, // 30 minutes in seconds
          participants: ['participant1@company.com', 'participant2@prospect.com'],
        };

        analytics.track('fireflies_fetch_transcript_detail_completed', {
          transcript_id: transcriptId,
          has_transcript: true,
          has_summary: true,
          source: 'mock_data',
        });

        return mockDetail;
      }

      const response = await api.get(`${API_ENDPOINTS.FIREFLIES.GET_TRANSCRIPT_DETAIL}/${transcriptId}`);

      analytics.track('fireflies_fetch_transcript_detail_completed', {
        transcript_id: transcriptId,
        has_transcript: !!response.data.transcript,
        has_summary: !!response.data.summary,
        source: 'api',
      });

      return response.data;
    } catch (error) {
      analytics.track('fireflies_fetch_transcript_detail_failed', {
        transcript_id: transcriptId,
        error: error.message,
      });
      
      console.error('Error fetching Fireflies transcript detail:', error);
      throw new Error(`Failed to load transcript details: ${error.message}`);
    }
  }

  // Sync transcripts from Fireflies
  async syncTranscripts(options = {}) {
    try {
      analytics.track('fireflies_sync_started', {
        sync_options: Object.keys(options),
      });

      // Check if we're in development or if API is unavailable
      const isApiAvailable = await this.checkApiAvailability();
      
      if (this.isDevelopment && !isApiAvailable) {
        console.warn('API not available in development, simulating sync');
        
        // Simulate sync delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockSyncResult = {
          synced_count: this.mockData.length,
          new_transcripts: 1,
          updated_transcripts: this.mockData.length - 1,
          status: 'completed',
          message: 'Mock sync completed successfully',
        };

        analytics.track('fireflies_sync_completed', {
          ...mockSyncResult,
          source: 'mock_data',
        });

        return mockSyncResult;
      }

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
        source: 'api',
      });

      return response.data;
    } catch (error) {
      analytics.track('fireflies_sync_failed', {
        error: error.message,
      });
      
      console.error('Error syncing Fireflies transcripts:', error);
      
      // If it's a network error and we're in development, return mock success
      if (this.isDevelopment && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
        console.warn('Network error in development, returning mock sync result');
        return {
          synced_count: this.mockData.length,
          new_transcripts: 0,
          updated_transcripts: this.mockData.length,
          status: 'completed_with_fallback',
          message: 'Sync completed using fallback data (development mode)',
        };
      }
      
      throw new Error(`Failed to sync Fireflies transcripts: ${error.message}`);
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
      const isApiAvailable = await this.checkApiAvailability();
      
      if (!isApiAvailable) {
        return { 
          connected: false, 
          error: 'API server not reachable',
          fallback_mode: this.isDevelopment,
        };
      }

      const response = await api.get('/fireflies/status');
      return response.data;
    } catch (error) {
      console.error('Error checking Fireflies connection:', error);
      return { 
        connected: false, 
        error: error.message,
        fallback_mode: this.isDevelopment,
      };
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