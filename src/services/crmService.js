import api from '@/lib/api';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { analytics } from '@/lib/analytics';

// CRM Service for handling all CRM integrations
class CRMService {
  // HubSpot Integration
  hubspot = {
    // Connect to HubSpot
    connect: async (authCode) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.HUBSPOT.CONNECT, {
          auth_code: authCode,
          timestamp: new Date().toISOString(),
        });

        analytics.trackCrmIntegration('connect', 'hubspot', true, {
          connection_id: response.data.connection_id,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('connect', 'hubspot', false, {
          error: error.message,
        });
        throw error;
      }
    },

    // Disconnect from HubSpot
    disconnect: async () => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.HUBSPOT.DISCONNECT);

        analytics.trackCrmIntegration('disconnect', 'hubspot', true);

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('disconnect', 'hubspot', false, {
          error: error.message,
        });
        throw error;
      }
    },

    // Push email to HubSpot
    pushEmail: async (emailData, contactId, dealId = null) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.HUBSPOT.PUSH_EMAIL, {
          email_content: emailData.content,
          email_subject: emailData.subject,
          contact_id: contactId,
          deal_id: dealId,
          timestamp: new Date().toISOString(),
        });

        analytics.trackCrmIntegration('push_email', 'hubspot', true, {
          contact_id: contactId,
          deal_id: dealId,
          hubspot_id: response.data.hubspot_id,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('push_email', 'hubspot', false, {
          contact_id: contactId,
          error: error.message,
        });
        throw error;
      }
    },

    // Push commitments/action items to HubSpot
    pushCommitments: async (commitments, contactId, dealId = null) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.HUBSPOT.PUSH_COMMITMENTS, {
          commitments: commitments.map(c => ({
            text: c.commitment_text,
            owner: c.owner,
            deadline: c.deadline,
            priority: c.priority,
          })),
          contact_id: contactId,
          deal_id: dealId,
          timestamp: new Date().toISOString(),
        });

        analytics.trackCrmIntegration('push_commitments', 'hubspot', true, {
          contact_id: contactId,
          deal_id: dealId,
          commitments_count: commitments.length,
          hubspot_ids: response.data.hubspot_ids,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('push_commitments', 'hubspot', false, {
          contact_id: contactId,
          commitments_count: commitments.length,
          error: error.message,
        });
        throw error;
      }
    },

    // Push call notes to HubSpot
    pushNotes: async (notesData, contactId, dealId = null) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.HUBSPOT.PUSH_NOTES, {
          notes_content: notesData.content,
          call_date: notesData.date,
          call_duration: notesData.duration,
          contact_id: contactId,
          deal_id: dealId,
          timestamp: new Date().toISOString(),
        });

        analytics.trackCrmIntegration('push_notes', 'hubspot', true, {
          contact_id: contactId,
          deal_id: dealId,
          hubspot_id: response.data.hubspot_id,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('push_notes', 'hubspot', false, {
          contact_id: contactId,
          error: error.message,
        });
        throw error;
      }
    },

    // Sync contacts from HubSpot
    syncContacts: async (options = {}) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.HUBSPOT.SYNC_CONTACTS, {
          sync_options: {
            limit: options.limit || 100,
            last_sync: options.lastSync,
            include_deals: options.includeDeals !== false,
            ...options,
          },
          timestamp: new Date().toISOString(),
        });

        analytics.trackCrmIntegration('sync_contacts', 'hubspot', true, {
          contacts_synced: response.data.contacts_count,
          deals_synced: response.data.deals_count,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('sync_contacts', 'hubspot', false, {
          error: error.message,
        });
        throw error;
      }
    },

    // Get deals from HubSpot
    getDeals: async (params = {}) => {
      try {
        const response = await api.get(API_ENDPOINTS.CRM.HUBSPOT.GET_DEALS, {
          limit: params.limit || 50,
          offset: params.offset || 0,
          stage: params.stage,
          owner: params.owner,
          ...params,
        });

        return response.data;
      } catch (error) {
        console.error('Error fetching HubSpot deals:', error);
        throw error;
      }
    },
  };

  // Salesforce Integration (placeholder)
  salesforce = {
    connect: async (credentials) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.SALESFORCE.CONNECT, credentials);

        analytics.trackCrmIntegration('connect', 'salesforce', true, {
          connection_id: response.data.connection_id,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('connect', 'salesforce', false, {
          error: error.message,
        });
        throw error;
      }
    },

    disconnect: async () => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.SALESFORCE.DISCONNECT);

        analytics.trackCrmIntegration('disconnect', 'salesforce', true);

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('disconnect', 'salesforce', false, {
          error: error.message,
        });
        throw error;
      }
    },

    pushData: async (data, objectType) => {
      try {
        const response = await api.post(API_ENDPOINTS.CRM.SALESFORCE.PUSH_DATA, {
          data,
          object_type: objectType,
          timestamp: new Date().toISOString(),
        });

        analytics.trackCrmIntegration('push_data', 'salesforce', true, {
          object_type: objectType,
          salesforce_id: response.data.salesforce_id,
        });

        return response.data;
      } catch (error) {
        analytics.trackCrmIntegration('push_data', 'salesforce', false, {
          object_type: objectType,
          error: error.message,
        });
        throw error;
      }
    },
  };

  // Generic CRM operations
  async getConnectionStatus(platform = 'hubspot') {
    try {
      const endpoint = platform === 'hubspot' 
        ? API_ENDPOINTS.CRM.HUBSPOT.CONNECT 
        : API_ENDPOINTS.CRM.SALESFORCE.CONNECT;
      
      const response = await api.get(`${endpoint}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error getting ${platform} connection status:`, error);
      throw error;
    }
  }

  async batchPush(platform, operations) {
    try {
      const requests = operations.map(op => {
        let endpoint;
        switch (op.type) {
          case 'email':
            endpoint = platform === 'hubspot' 
              ? API_ENDPOINTS.CRM.HUBSPOT.PUSH_EMAIL 
              : API_ENDPOINTS.CRM.SALESFORCE.PUSH_DATA;
            break;
          case 'commitments':
            endpoint = platform === 'hubspot' 
              ? API_ENDPOINTS.CRM.HUBSPOT.PUSH_COMMITMENTS 
              : API_ENDPOINTS.CRM.SALESFORCE.PUSH_DATA;
            break;
          case 'notes':
            endpoint = platform === 'hubspot' 
              ? API_ENDPOINTS.CRM.HUBSPOT.PUSH_NOTES 
              : API_ENDPOINTS.CRM.SALESFORCE.PUSH_DATA;
            break;
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }

        return {
          method: 'POST',
          endpoint,
          body: op.data,
        };
      });

      const response = await api.batch(requests);

      analytics.track('crm_batch_push', {
        platform,
        operations_count: operations.length,
        successful_operations: response.filter(r => r.success).length,
        failed_operations: response.filter(r => !r.success).length,
      });

      return response;
    } catch (error) {
      analytics.track('crm_batch_push_failed', {
        platform,
        operations_count: operations.length,
        error: error.message,
      });
      throw error;
    }
  }
}

// Create and export singleton instance
const crmService = new CRMService();
export default crmService;

// Export platform-specific services for convenience
export const { hubspot, salesforce } = crmService;