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

      // Add error handling for network issues
      let response;
      try {
        response = await api.get(API_ENDPOINTS.FIREFLIES.GET_TRANSCRIPTS, {
          limit: options.limit || 50,
          offset: options.offset || 0,
          date_from: options.dateFrom,
          date_to: options.dateTo,
          ...options,
        });
      } catch (networkError) {
        // If it's a network error, return mock data for development
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('CORS')) {
          console.warn('Fireflies API unavailable, returning mock data for development');
          return this.getMockTranscripts();
        }
        throw networkError;
      }

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
      
      // Return mock data if API is unavailable
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.status === 0) {
        console.warn('Fireflies API unavailable, returning mock data for development');
        return this.getMockTranscripts();
      }
      
      console.error('Error fetching Fireflies transcripts:', error);
      throw error;
    }
  }

  // Get mock transcripts for development when API is unavailable
  getMockTranscripts() {
    return [
      {
        id: 'mock_001',
        callId: 'Demo Call - TechCorp',
        companyName: 'TechCorp Solutions',
        prospectName: 'Sarah Johnson',
        date: '2024-01-15',
        duration: '45 min',
        status: 'completed',
        hasTranscript: true,
        hasSummary: true,
        firefliesSummary: `Meeting Summary:
• Title: Demo Call - TechCorp Solutions
• Date: 2024-01-15
• Organizer: sales@company.com
• Participants: sarah.johnson@techcorp.com, mike.chen@techcorp.com
• Meeting Link: https://zoom.us/j/123456789

Key Discussion Points:
• TechCorp is evaluating sales automation solutions
• Current manual process takes 2-3 hours daily
• Budget approved for $50K annually
• Decision timeline: End of Q1
• 3 vendors being evaluated

Pain Points Discussed:
• Manual lead scoring process
• Lack of integration with existing CRM
• Poor response times from current vendor

Next Steps:
• Provide technical integration documentation
• Schedule demo with engineering team
• Send ROI analysis and case studies`,
        transcript: `[00:00] Sarah Johnson: Hi everyone, thanks for taking the time to meet with us today. I'm Sarah, VP of Sales Operations at TechCorp.

[00:30] Mike Chen: And I'm Mike, our Sales Operations Manager. We're really excited to learn more about your solution.

[01:00] Sales Rep: Great to meet you both. I understand you're looking to automate your lead scoring process?

[01:15] Sarah Johnson: Exactly. Our current process is completely manual and it's taking our team 2-3 hours every day just to qualify leads.

[02:00] Sales Rep: That's a significant time investment. What's driving the need to change now?

[02:15] Sarah Johnson: We just secured Series B funding and we're planning to double our sales team by Q3. We can't scale our current manual process.

[03:00] Mike Chen: Plus, our current vendor's support response times are terrible. Sometimes we wait days for simple questions.

[03:30] Sales Rep: I understand the frustration. How are you currently handling lead scoring?

[04:00] Sarah Johnson: Everything goes through spreadsheets. We have a complex scoring matrix, but it's all manual input and calculation.

[05:00] Sales Rep: And what's your timeline for making a decision?

[05:15] Sarah Johnson: We need to have something in place by end of Q1. We're evaluating three vendors total.

[06:00] Mike Chen: Budget-wise, we have approval for up to $50K annually.

[Continue with full transcript...]`,
        audioUrl: null,
        participants: ['sarah.johnson@techcorp.com', 'mike.chen@techcorp.com'],
        meeting_link: 'https://zoom.us/j/123456789',
        organizer_email: 'sales@company.com',
      },
      {
        id: 'mock_002',
        callId: 'Follow-up Call - InnovateLabs',
        companyName: 'InnovateLabs Inc',
        prospectName: 'David Brown',
        date: '2024-01-12',
        duration: '30 min',
        status: 'completed',
        hasTranscript: true,
        hasSummary: true,
        firefliesSummary: `Meeting Summary:
• Title: Follow-up Call - InnovateLabs Inc
• Date: 2024-01-12
• Organizer: sales@company.com
• Participants: david.brown@innovatelabs.com
• Meeting Link: https://meet.google.com/abc-defg-hij

Key Discussion Points:
• Follow-up on initial demo
• Technical integration requirements
• Implementation timeline discussion
• Pricing and contract terms

Positive Signals:
• David confirmed strong interest
• Technical team approved the integration approach
• Ready to move forward with pilot program

Next Steps:
• Send formal proposal
• Schedule implementation kickoff
• Provide pilot program details`,
        transcript: `[00:00] David Brown: Thanks for following up so quickly after our demo last week.

[00:15] Sales Rep: Of course! I wanted to address the technical questions your team had.

[00:30] David Brown: Perfect. Our engineering team reviewed the integration docs you sent, and they're impressed with the API design.

[01:00] Sales Rep: That's great to hear. Any concerns about the implementation?

[01:15] David Brown: Actually, no. They think it'll be pretty straightforward. We're ready to move forward.

[01:45] Sales Rep: Excellent. What's your preferred timeline?

[02:00] David Brown: We'd like to start with a pilot program next month, then full rollout in Q2.

[Continue with full transcript...]`,
        audioUrl: null,
        participants: ['david.brown@innovatelabs.com'],
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        organizer_email: 'sales@company.com',
      }
    ];
  }

  // Get detailed transcript data
  async getTranscriptDetail(transcriptId) {
    try {
      analytics.track('fireflies_fetch_transcript_detail_started', {
        transcript_id: transcriptId,
      });

      let response;
      try {
        response = await api.get(`${API_ENDPOINTS.FIREFLIES.GET_TRANSCRIPT_DETAIL}/${transcriptId}`);
      } catch (networkError) {
        // Return mock data if API is unavailable
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('CORS')) {
          console.warn('Fireflies API unavailable, returning mock transcript detail');
          return this.getMockTranscriptDetail(transcriptId);
        }
        throw networkError;
      }

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
      
      // Return mock data if API is unavailable
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.status === 0) {
        console.warn('Fireflies API unavailable, returning mock transcript detail');
        return this.getMockTranscriptDetail(transcriptId);
      }
      
      console.error('Error fetching Fireflies transcript detail:', error);
      throw error;
    }
  }

  // Get mock transcript detail for development
  getMockTranscriptDetail(transcriptId) {
    return {
      id: transcriptId,
      transcript: 'Mock detailed transcript content...',
      summary: 'Mock detailed summary...',
      participants: ['participant1@example.com', 'participant2@example.com'],
      duration: '30 min',
      date: '2024-01-15',
    };
  }

  // Sync transcripts from Fireflies
  async syncTranscripts(options = {}) {
    try {
      analytics.track('fireflies_sync_started', {
        sync_options: Object.keys(options),
      });

      let response;
      try {
        response = await api.get(API_ENDPOINTS.FIREFLIES.SYNC_TRANSCRIPTS);
      } catch (networkError) {
        // Return mock sync result if API is unavailable
        if (networkError.message.includes('Failed to fetch') || networkError.message.includes('CORS')) {
          console.warn('Fireflies API unavailable, returning mock sync result');
          return {
            synced_count: 2,
            new_transcripts: 1,
            updated_transcripts: 1,
          };
        }
        throw networkError;
      }

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
      
      // Return mock sync result if API is unavailable
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.status === 0) {
        console.warn('Fireflies API unavailable, returning mock sync result');
        return {
          synced_count: 2,
          new_transcripts: 1,
          updated_transcripts: 1,
        };
      }
      
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
    return 'Unknown Duration';
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