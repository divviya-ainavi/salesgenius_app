import api from '@/lib/api';
import { config } from '@/lib/config';
import { analytics } from '@/lib/analytics';
import { dbHelpers } from '@/lib/supabase';

// HubSpot Service for handling HubSpot API integrations
class HubSpotService {
  // Get all companies from HubSpot for an organization
  async getCompanies(organizationId, hubspotUserId) {
    try {
      analytics.track('hubspot_get_companies_started', {
        organization_id: organizationId,
        hubspot_user_id: hubspotUserId,
      });

      const response = await api.post(config.api.endpoints.hubspotGetCompanies, {
        id: organizationId,
        ownerid: hubspotUserId,
      });

      // Extract companies from nested response structure
      const companies = response.data?.[0]?.Companies || response.data?.Companies || [];

      analytics.track('hubspot_get_companies_completed', {
        organization_id: organizationId,
        companies_count: companies.length,
      });

      return companies;
    } catch (error) {
      analytics.track('hubspot_get_companies_failed', {
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error fetching HubSpot companies:', error);
      throw error;
    }
  }

  // Get deals for a specific company from HubSpot
  async getDeals(companyId, organizationId, hubspotUserId) {
    try {
      analytics.track('hubspot_get_deals_started', {
        company_id: companyId,
        organization_id: organizationId,
        hubspot_user_id: hubspotUserId,
      });

      const response = await api.post(config.api.endpoints.hubspotGetDeals, {
        companyid: companyId,
        id: organizationId,
        ownerid: hubspotUserId,
      });

      // Extract deals from nested response structure
      const deals = response.data?.[0]?.Deals || response.data?.Deals || [];

      analytics.track('hubspot_get_deals_completed', {
        company_id: companyId,
        organization_id: organizationId,
        deals_count: deals.length,
      });

      return deals;
    } catch (error) {
      analytics.track('hubspot_get_deals_failed', {
        company_id: companyId,
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error fetching HubSpot deals:', error);
      throw error;
    }
  }

  // Sync companies from HubSpot to database
  async syncCompanies(organizationId, hubspotUserId) {
    try {
      console.log('🔄 HubSpotService - Starting company sync for org:', organizationId);

      // Fetch companies from HubSpot
      const hubspotCompanies = await this.getCompanies(organizationId, hubspotUserId);

      if (!hubspotCompanies || hubspotCompanies.length === 0) {
        console.log('📭 HubSpotService - No companies found in HubSpot');
        return {
          total: 0,
          inserted: 0,
          updated: 0,
          failed: 0,
          companies: [],
        };
      }

      console.log('📊 HubSpotService - Processing', hubspotCompanies.length, 'companies from HubSpot');

      // Use the database helper to sync companies
      const result = await dbHelpers.syncCompaniesFromHubSpot(hubspotCompanies, organizationId);

      analytics.track('hubspot_companies_synced', {
        organization_id: organizationId,
        total_companies: result.total,
        inserted: result.inserted,
        updated: result.updated,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      analytics.track('hubspot_companies_sync_failed', {
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error syncing companies from HubSpot:', error);
      throw error;
    }
  }

  // Sync deals for a specific company from HubSpot to database
  async syncDeals(hubspotCompanyId, companyId, organizationId, hubspotUserId) {
    try {
      console.log('🔄 HubSpotService - Starting deals sync for company:', hubspotCompanyId);

      // Fetch deals from HubSpot
      const hubspotDeals = await this.getDeals(hubspotCompanyId, organizationId, hubspotUserId);

      if (!hubspotDeals || hubspotDeals.length === 0) {
        console.log('📭 HubSpotService - No deals found in HubSpot for company:', hubspotCompanyId);
        return {
          total: 0,
          inserted: 0,
          updated: 0,
          failed: 0,
          prospects: [],
        };
      }

      console.log('📊 HubSpotService - Processing', hubspotDeals.length, 'deals from HubSpot');

      // Use the database helper to sync prospects
      const result = await dbHelpers.syncProspectsFromHubSpot(hubspotDeals, companyId, organizationId);

      analytics.track('hubspot_deals_synced', {
        company_id: companyId,
        hubspot_company_id: hubspotCompanyId,
        organization_id: organizationId,
        total_deals: result.total,
        inserted: result.inserted,
        updated: result.updated,
        failed: result.failed,
      });

      return result;
    } catch (error) {
      analytics.track('hubspot_deals_sync_failed', {
        company_id: companyId,
        hubspot_company_id: hubspotCompanyId,
        organization_id: organizationId,
        error: error.message,
      });
      console.error('Error syncing deals from HubSpot:', error);
      throw error;
    }
  }

  // Check if organization has HubSpot integration
  async checkIntegrationStatus(organizationId) {
    try {
      return await dbHelpers.checkHubSpotIntegration(organizationId);
    } catch (error) {
      console.error('Error checking HubSpot integration status:', error);
      return { connected: false, error: error.message };
    }
  }

  // Get HubSpot user details for current user
  async getCurrentUserHubSpotDetails() {
    try {
      return await dbHelpers.getHubSpotUserDetails();
    } catch (error) {
      console.error('Error getting current user HubSpot details:', error);
      throw error;
    }
  }

  // Validate HubSpot connection and get owner details
  async validateAndGetOwners(organizationId) {
    try {
      // Check if HubSpot is connected
      const integrationStatus = await this.checkIntegrationStatus(organizationId);
      
      if (!integrationStatus.connected) {
        throw new Error('HubSpot is not connected for this organization');
      }

      // Get any HubSpot user for the organization to make API calls
      const hubspotUser = await dbHelpers.getAnyHubSpotUserForOrg(organizationId);
      
      if (!hubspotUser) {
        throw new Error('No HubSpot users found for this organization');
      }

      // Fetch owner details from HubSpot
      const response = await api.post(config.api.endpoints.getOwnersDetails, {
        id: organizationId,
        ownerid: hubspotUser.hubspot_user_id,
      });

      return {
        owners: response.data,
        hubspotUser,
        integrationStatus,
      };
    } catch (error) {
      console.error('Error validating HubSpot and getting owners:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const hubspotService = new HubSpotService();
export default hubspotService;

// Export individual methods for convenience
export const {
  getCompanies,
  getDeals,
  syncCompanies,
  syncDeals,
  checkIntegrationStatus,
  getCurrentUserHubSpotDetails,
  validateAndGetOwners,
} = hubspotService;