import api from '@/lib/api';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { analytics } from '@/lib/analytics';
import { dbHelpers, CURRENT_USER } from '@/lib/supabase';

// CRM Service for handling all CRM integrations with user-specific credentials
class CRMService {
  // Get user's HubSpot credentials
  async getUserCredentials(userId = CURRENT_USER.id) {
    try {
      const credentials = await dbHelpers.getUserHubSpotCredentials(userId);
      return credentials;
    } catch (error) {
      console.error('Error getting user HubSpot credentials:', error);
      return null;
    }
  }

  // Check if access token is expired and refresh if needed
  async ensureValidToken(userId = CURRENT_USER.id) {
    try {
      const credentials = await this.getUserCredentials(userId);
      
      if (!credentials) {
        throw new Error('No HubSpot credentials found for user');
      }

      // Check if token is expired (with 5 minute buffer)
      const expiresAt = new Date(credentials.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (expiresAt.getTime() - now.getTime() < bufferTime) {
        // Token is expired or will expire soon, refresh it
        return await this.refreshAccessToken(userId, credentials.refresh_token);
      }

      return credentials;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(userId, refreshToken) {
    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData = await response.json();

      // Update tokens in database
      const updatedCredentials = await dbHelpers.updateUserHubSpotTokens(userId, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Some providers don't return new refresh token
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      });

      analytics.track('hubspot_token_refreshed', {
        user_id: userId,
      });

      return updatedCredentials;
    } catch (error) {
      analytics.track('hubspot_token_refresh_failed', {
        user_id: userId,
        error: error.message,
      });
      throw error;
    }
  }

  // HubSpot Integration with user-specific credentials
  hubspot = {
    // Connect to HubSpot with user credentials
    connect: async (authCode, userId = CURRENT_USER.id) => {
      try {
        // Exchange auth code for tokens
        const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: window.location.origin + '/hubspot/callback',
            client_id: 'your-client-id', // This should come from environment or config
            client_secret: 'your-client-secret', // This should come from environment or config
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`HubSpot connection failed: ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();

        // Get account info
        const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const accountData = await accountResponse.json();

        // Save credentials to database
        const credentials = await dbHelpers.saveUserHubSpotCredentials(userId, {
          client_id: 'your-client-id', // Store the client ID used
          client_secret: 'your-client-secret', // Store encrypted
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          scope: tokenData.scope,
          hub_domain: accountData.uiDomain,
          hub_id: accountData.portalId.toString(),
        });

        analytics.trackCrmIntegration('connect', 'hubspot', true, {
          user_id: userId,
          hub_id: accountData.portalId,
        });

        return {
          success: true,
          connection_id: credentials.id,
          hub_domain: accountData.uiDomain,
          hub_id: accountData.portalId,
        };
      } catch (error) {
        analytics.trackCrmIntegration('connect', 'hubspot', false, {
          user_id: userId,
          error: error.message,
        });
        throw error;
      }
    },

    // Disconnect from HubSpot
    disconnect: async (userId = CURRENT_USER.id) => {
      try {
        await dbHelpers.deleteUserHubSpotCredentials(userId);

        analytics.trackCrmIntegration('disconnect', 'hubspot', true, {
          user_id: userId,
        });

        return { success: true };
      } catch (error) {
        analytics.trackCrmIntegration('disconnect', 'hubspot', false, {
          user_id: userId,
          error: error.message,
        });
        throw error;
      }
    },

    // Push email to HubSpot using user's credentials
    pushEmail: async (emailData, contactId, dealId = null, userId = CURRENT_USER.id) => {
      try {
        const credentials = await this.ensureValidToken(userId);

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              hs_email_subject: emailData.subject,
              hs_email_text: emailData.content,
              hs_email_direction: 'EMAIL',
              hs_email_status: 'SENT',
            },
            associations: [
              {
                to: { id: contactId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 198 }],
              },
              ...(dealId ? [{
                to: { id: dealId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 204 }],
              }] : []),
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`);
        }

        const result = await response.json();

        analytics.trackCrmIntegration('push_email', 'hubspot', true, {
          user_id: userId,
          contact_id: contactId,
          deal_id: dealId,
          hubspot_id: result.id,
        });

        return {
          success: true,
          hubspot_id: result.id,
        };
      } catch (error) {
        analytics.trackCrmIntegration('push_email', 'hubspot', false, {
          user_id: userId,
          contact_id: contactId,
          error: error.message,
        });
        throw error;
      }
    },

    // Push commitments/action items to HubSpot as tasks
    pushCommitments: async (commitments, contactId, dealId = null, userId = CURRENT_USER.id) => {
      try {
        const credentials = await this.ensureValidToken(userId);
        const hubspotIds = [];

        for (const commitment of commitments) {
          const taskData = {
            properties: {
              hs_task_subject: commitment.commitment_text,
              hs_task_body: `Action item from sales call`,
              hs_task_status: 'NOT_STARTED',
              hs_task_priority: this.mapPriorityToHubSpot(commitment.priority),
              hs_task_type: 'TODO',
            },
            associations: [
              {
                to: { id: contactId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 204 }],
              },
              ...(dealId ? [{
                to: { id: dealId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 216 }],
              }] : []),
            ],
          };

          // Add due date if available
          if (commitment.deadline) {
            taskData.properties.hs_task_completion_date = new Date(commitment.deadline).getTime();
          }

          const response = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${credentials.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
          });

          if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.statusText}`);
          }

          const result = await response.json();
          hubspotIds.push(result.id);
        }

        analytics.trackCrmIntegration('push_commitments', 'hubspot', true, {
          user_id: userId,
          contact_id: contactId,
          deal_id: dealId,
          commitments_count: commitments.length,
          hubspot_ids: hubspotIds,
        });

        return {
          success: true,
          hubspot_ids: hubspotIds,
        };
      } catch (error) {
        analytics.trackCrmIntegration('push_commitments', 'hubspot', false, {
          user_id: userId,
          contact_id: contactId,
          commitments_count: commitments.length,
          error: error.message,
        });
        throw error;
      }
    },

    // Push call notes to HubSpot
    pushNotes: async (notesData, contactId, dealId = null, userId = CURRENT_USER.id) => {
      try {
        const credentials = await this.ensureValidToken(userId);

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              hs_note_body: notesData.content,
              hs_timestamp: new Date(notesData.date).getTime(),
            },
            associations: [
              {
                to: { id: contactId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
              },
              ...(dealId ? [{
                to: { id: dealId },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }],
              }] : []),
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`);
        }

        const result = await response.json();

        analytics.trackCrmIntegration('push_notes', 'hubspot', true, {
          user_id: userId,
          contact_id: contactId,
          deal_id: dealId,
          hubspot_id: result.id,
        });

        return {
          success: true,
          hubspot_id: result.id,
        };
      } catch (error) {
        analytics.trackCrmIntegration('push_notes', 'hubspot', false, {
          user_id: userId,
          contact_id: contactId,
          error: error.message,
        });
        throw error;
      }
    },

    // Sync contacts from HubSpot
    syncContacts: async (options = {}, userId = CURRENT_USER.id) => {
      try {
        const credentials = await this.ensureValidToken(userId);

        const params = new URLSearchParams({
          limit: (options.limit || 100).toString(),
          properties: 'firstname,lastname,email,company,phone',
          ...(options.after && { after: options.after }),
        });

        const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts?${params}`, {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`);
        }

        const result = await response.json();

        analytics.trackCrmIntegration('sync_contacts', 'hubspot', true, {
          user_id: userId,
          contacts_synced: result.results.length,
        });

        return {
          success: true,
          contacts: result.results,
          total: result.total,
          hasMore: !!result.paging?.next,
          nextAfter: result.paging?.next?.after,
        };
      } catch (error) {
        analytics.trackCrmIntegration('sync_contacts', 'hubspot', false, {
          user_id: userId,
          error: error.message,
        });
        throw error;
      }
    },

    // Get deals from HubSpot
    getDeals: async (params = {}, userId = CURRENT_USER.id) => {
      try {
        const credentials = await this.ensureValidToken(userId);

        const queryParams = new URLSearchParams({
          limit: (params.limit || 50).toString(),
          properties: 'dealname,amount,dealstage,closedate,pipeline',
          ...(params.after && { after: params.after }),
        });

        const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.statusText}`);
        }

        const result = await response.json();

        return {
          success: true,
          deals: result.results,
          total: result.total,
          hasMore: !!result.paging?.next,
        };
      } catch (error) {
        console.error('Error fetching HubSpot deals:', error);
        throw error;
      }
    },
  };

  // Helper method to map priority levels
  mapPriorityToHubSpot(priority) {
    const priorityMap = {
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW',
    };
    return priorityMap[priority] || 'MEDIUM';
  }

  // Generic CRM operations
  async getConnectionStatus(platform = 'hubspot', userId = CURRENT_USER.id) {
    try {
      if (platform === 'hubspot') {
        const credentials = await this.getUserCredentials(userId);
        
        if (!credentials) {
          return {
            connected: false,
            error: 'No credentials found',
          };
        }

        // Check if token is still valid by making a simple API call
        try {
          const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
            headers: {
              'Authorization': `Bearer ${credentials.access_token}`,
            },
          });

          if (response.ok) {
            const accountData = await response.json();
            return {
              connected: true,
              hub_domain: credentials.hub_domain,
              hub_id: credentials.hub_id,
              account_name: accountData.companyName,
              last_sync: credentials.updated_at,
            };
          } else if (response.status === 401) {
            // Token expired, try to refresh
            try {
              await this.ensureValidToken(userId);
              return {
                connected: true,
                hub_domain: credentials.hub_domain,
                hub_id: credentials.hub_id,
                last_sync: credentials.updated_at,
              };
            } catch (refreshError) {
              return {
                connected: false,
                error: 'Token expired and refresh failed',
              };
            }
          } else {
            return {
              connected: false,
              error: `API error: ${response.statusText}`,
            };
          }
        } catch (apiError) {
          return {
            connected: false,
            error: `Connection test failed: ${apiError.message}`,
          };
        }
      }

      return {
        connected: false,
        error: 'Unsupported platform',
      };
    } catch (error) {
      console.error(`Error getting ${platform} connection status:`, error);
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  async batchPush(platform, operations, userId = CURRENT_USER.id) {
    try {
      const results = [];

      for (const operation of operations) {
        try {
          let result;
          switch (operation.type) {
            case 'email':
              result = await this.hubspot.pushEmail(
                operation.data,
                operation.contactId,
                operation.dealId,
                userId
              );
              break;
            case 'commitments':
              result = await this.hubspot.pushCommitments(
                operation.data,
                operation.contactId,
                operation.dealId,
                userId
              );
              break;
            case 'notes':
              result = await this.hubspot.pushNotes(
                operation.data,
                operation.contactId,
                operation.dealId,
                userId
              );
              break;
            default:
              throw new Error(`Unknown operation type: ${operation.type}`);
          }

          results.push({
            ...operation,
            success: true,
            data: result,
          });
        } catch (error) {
          results.push({
            ...operation,
            success: false,
            error: error.message,
          });
        }
      }

      analytics.track('crm_batch_push', {
        platform,
        user_id: userId,
        operations_count: operations.length,
        successful_operations: results.filter(r => r.success).length,
        failed_operations: results.filter(r => !r.success).length,
      });

      return results;
    } catch (error) {
      analytics.track('crm_batch_push_failed', {
        platform,
        user_id: userId,
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
export const { hubspot } = crmService;