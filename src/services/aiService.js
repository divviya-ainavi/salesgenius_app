import api from '@/lib/api.jsx';
import API_ENDPOINTS from '@/lib/apiEndpoints.jsx';
import { analytics } from '@/lib/analytics.jsx';

// AI Service for handling all AI agent interactions
class AIService {
  // Research Agent
  async callResearchAgent(data) {
    try {
      analytics.trackAiInteraction('research_analysis', 'user_input', 'research_summary', true, {
        input_type: typeof data,
      });

      const response = await api.post(API_ENDPOINTS.AI_AGENTS.RESEARCH, {
        input: data,
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('research_analysis', 'user_input', 'research_summary', true, {
        findings_count: response.data.key_findings?.length || 0,
        response_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('research_analysis', 'user_input', 'research_summary', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Follow-up Agent
  async callFollowUpAgent(transcriptData, options = {}) {
    try {
      const response = await api.post(API_ENDPOINTS.AI_AGENTS.FOLLOW_UP, {
        transcript: transcriptData,
        options: {
          include_email: options.includeEmail !== false,
          include_commitments: options.includeCommitments !== false,
          include_insights: options.includeInsights !== false,
          include_deck_prompt: options.includeDeckPrompt !== false,
          ...options,
        },
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('call_analysis', 'transcript', 'follow_up_content', true, {
        transcript_length: transcriptData.length,
        commitments_count: response.data.commitments?.length || 0,
        has_email: !!response.data.follow_up_email,
        has_deck_prompt: !!response.data.deck_prompt,
        processing_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('call_analysis', 'transcript', 'follow_up_content', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Email Generation
  async generateEmail(prospectData, callContext, options = {}) {
    try {
      const response = await api.post(API_ENDPOINTS.AI_AGENTS.EMAIL_GENERATION, {
        prospect: prospectData,
        call_context: callContext,
        options: {
          tone: options.tone || 'professional',
          length: options.length || 'medium',
          include_attachments: options.includeAttachments || false,
          communication_style: options.communicationStyle,
          ...options,
        },
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('email_generation', 'prospect_data', 'email_template', true, {
        prospect_id: prospectData.id,
        email_length: response.data.email_content?.length || 0,
        tone: options.tone,
        processing_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('email_generation', 'prospect_data', 'email_template', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Presentation Builder
  async generatePresentationPrompt(prospectData, methodology, objective, contentLibrary = []) {
    try {
      const response = await api.post(API_ENDPOINTS.AI_AGENTS.PRESENTATION_BUILDER, {
        prospect: prospectData,
        methodology,
        objective,
        content_library: contentLibrary,
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('presentation_generation', 'prospect_data', 'presentation_prompt', true, {
        prospect_id: prospectData.id,
        methodology,
        objective,
        content_items: contentLibrary.length,
        prompt_length: response.data.prompt_content?.length || 0,
        processing_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('presentation_generation', 'prospect_data', 'presentation_prompt', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Insight Analysis
  async analyzeInsights(callData, existingInsights = []) {
    try {
      const response = await api.post(API_ENDPOINTS.AI_AGENTS.INSIGHT_ANALYSIS, {
        call_data: callData,
        existing_insights: existingInsights,
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('insight_analysis', 'call_data', 'insights', true, {
        insights_count: response.data.insights?.length || 0,
        existing_insights_count: existingInsights.length,
        processing_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('insight_analysis', 'call_data', 'insights', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Communication Style Analysis
  async analyzeCommunicationStyle(transcriptData, participantData = []) {
    try {
      const response = await api.post(API_ENDPOINTS.AI_AGENTS.COMMUNICATION_STYLE, {
        transcript: transcriptData,
        participants: participantData,
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('communication_analysis', 'transcript', 'communication_styles', true, {
        participants_count: participantData.length,
        styles_detected: response.data.communication_styles?.length || 0,
        processing_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('communication_analysis', 'transcript', 'communication_styles', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Content Refinement
  async refineContent(contentType, originalContent, refinementPrompt, context = {}) {
    try {
      const response = await api.post(API_ENDPOINTS.CONTENT.REFINEMENT, {
        content_type: contentType,
        original_content: originalContent,
        refinement_prompt: refinementPrompt,
        context,
        user_context: this.getUserContext(),
        timestamp: new Date().toISOString(),
      });

      analytics.trackAiInteraction('content_refinement', 'user_prompt', 'refined_content', true, {
        content_type: contentType,
        original_length: originalContent.length,
        refined_length: response.data.refined_content?.length || 0,
        processing_time: response.data.processing_time,
      });

      return response.data;
    } catch (error) {
      analytics.trackAiInteraction('content_refinement', 'user_prompt', 'refined_content', false, {
        error: error.message,
      });
      throw error;
    }
  }

  // Helper method to get user context
  getUserContext() {
    // This would typically come from your auth/user state
    return {
      user_id: 'current_user_id', // Replace with actual user ID
      organization_id: 'current_org_id', // Replace with actual org ID
      preferences: {
        // User preferences that might affect AI responses
      },
    };
  }

  // Batch AI processing
  async batchProcess(requests) {
    try {
      const response = await api.batch(requests.map(req => ({
        method: 'POST',
        endpoint: req.endpoint,
        body: {
          ...req.data,
          user_context: this.getUserContext(),
          timestamp: new Date().toISOString(),
        },
      })));

      analytics.track('ai_batch_processing', {
        requests_count: requests.length,
        successful_requests: response.filter(r => r.success).length,
        failed_requests: response.filter(r => !r.success).length,
      });

      return response;
    } catch (error) {
      analytics.track('ai_batch_processing_failed', {
        requests_count: requests.length,
        error: error.message,
      });
      throw error;
    }
  }
}

// Create and export singleton instance
const aiService = new AIService();
export default aiService;

// Export individual methods for convenience
export const {
  callResearchAgent,
  callFollowUpAgent,
  generateEmail,
  generatePresentationPrompt,
  analyzeInsights,
  analyzeCommunicationStyle,
  refineContent,
  batchProcess,
} = aiService;