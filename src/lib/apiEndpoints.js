// API Endpoints Configuration
// This file centralizes all API endpoint definitions for easy maintenance

const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // AI Agent endpoints
  AI_AGENTS: {
    RESEARCH: '/ai/research-agent',
    FOLLOW_UP: '/ai/follow-up-agent',
    EMAIL_GENERATION: '/ai/email-generation',
    PRESENTATION_BUILDER: '/ai/presentation-builder',
    INSIGHT_ANALYSIS: '/ai/insight-analysis',
    COMMUNICATION_STYLE: '/ai/communication-style',
  },

  // File management endpoints
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/download',
    DELETE: '/files/delete',
    LIST: '/files/list',
    PROCESS: '/files/process',
    TRANSCRIPT_ANALYSIS: '/files/transcript-analysis',
  },

  // Call processing endpoints
  CALLS: {
    PROCESS: '/calls/process',
    INSIGHTS: '/calls/insights',
    SUMMARY: '/calls/summary',
    COMMITMENTS: '/calls/commitments',
    FOLLOW_UP: '/calls/follow-up',
    ANALYSIS: '/calls/analysis',
  },

  // Fireflies.ai Integration endpoints
  FIREFLIES: {
    GET_TRANSCRIPTS: '/get-fireflies-transcripts',
    GET_TRANSCRIPT_DETAIL: '/get-fireflies-transcript',
    SYNC_TRANSCRIPTS: '/sync-fireflies-transcripts',
  },

  // Prospect management endpoints
  PROSPECTS: {
    LIST: '/prospects/list',
    GET: '/prospects/get',
    CREATE: '/prospects/create',
    UPDATE: '/prospects/update',
    DELETE: '/prospects/delete',
    INSIGHTS: '/prospects/insights',
    COMMUNICATION_HISTORY: '/prospects/communication-history',
  },

  // CRM Integration endpoints
  CRM: {
    HUBSPOT: {
      CONNECT: '/crm/hubspot/connect',
      DISCONNECT: '/crm/hubspot/disconnect',
      PUSH_EMAIL: '/crm/hubspot/push-email',
      PUSH_COMMITMENTS: '/crm/hubspot/push-commitments',
      PUSH_NOTES: '/crm/hubspot/push-notes',
      SYNC_CONTACTS: '/crm/hubspot/sync-contacts',
      GET_DEALS: '/crm/hubspot/deals',
    },
    SALESFORCE: {
      CONNECT: '/crm/salesforce/connect',
      DISCONNECT: '/crm/salesforce/disconnect',
      PUSH_DATA: '/crm/salesforce/push-data',
    },
  },

  // Content generation endpoints
  CONTENT: {
    EMAIL_TEMPLATES: '/content/email-templates',
    PRESENTATION_PROMPTS: '/content/presentation-prompts',
    ACTION_ITEMS: '/content/action-items',
    INSIGHTS: '/content/insights',
    REFINEMENT: '/content/refinement',
  },

  // Analytics endpoints
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PERFORMANCE: '/analytics/performance',
    USAGE: '/analytics/usage',
    REPORTS: '/analytics/reports',
    EXPORT: '/analytics/export',
  },

  // User management endpoints
  USERS: {
    PROFILE: '/users/profile',
    SETTINGS: '/users/settings',
    PREFERENCES: '/users/preferences',
    ORGANIZATIONS: '/users/organizations',
  },

  // System endpoints
  SYSTEM: {
    HEALTH: '/health',
    STATUS: '/status',
    VERSION: '/version',
    CONFIG: '/config',
  },

  // Webhook endpoints
  WEBHOOKS: {
    FIREFLIES: '/webhooks/fireflies',
    HUBSPOT: '/webhooks/hubspot',
    CALENDAR: '/webhooks/calendar',
  },
};

// Helper function to build endpoint URLs with parameters
export const buildEndpoint = (endpoint, params = {}) => {
  let url = endpoint;
  
  // Replace path parameters (e.g., /users/:id -> /users/123)
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Helper function to get nested endpoint
export const getEndpoint = (path) => {
  const keys = path.split('.');
  let endpoint = API_ENDPOINTS;
  
  for (const key of keys) {
    endpoint = endpoint[key];
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${path}`);
    }
  }
  
  return endpoint;
};

export default API_ENDPOINTS;