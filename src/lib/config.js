// Configuration file for environment variables
// This centralizes all environment variable access

export const config = {
  // Authentication & Security
  passwordSalt: import.meta.env.VITE_PASSWORD_SALT || 'SG_2025',
  jwtSecret: import.meta.env.VITE_JWT_SECRET || 'SG',

  // HubSpot Integration
  hubspot: {
    clientId: import.meta.env.VITE_HUBSPOT_CLIENT_ID,
    clientSecret: import.meta.env.VITE_HUBSPOT_CLIENT_SECRET,
    redirectUri: import.meta.env.VITE_HUBSPOT_REDIRECT_URI || 'http://localhost:5173/hubspot-callback',
    scopes: 'crm.objects.contacts.write crm.dealsplits.read_write oauth crm.lists.write crm.lists.read crm.objects.deals.read crm.objects.deals.write crm.objects.contacts.read',
    authUrl: 'https://app-na2.hubspot.com/oauth/authorize'
  },

  // PostHog Analytics
  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_KEY,
    apiHost: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
    analyticsKey: import.meta.env.VITE_POSTHOG_ANALYTICS
  },

  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://salesgenius.ainavi.co.uk/n8n/webhook/',
    // Specific endpoints
    endpoints: {
      companyResearch: 'company-research-v4',
      generatePrompt: 'generate-propmt-v2',
      generateFollowupEmail: 'generate-followup-email-v2',
      refinePresentationPrompt: 'refine-presentation-prompt',
      refineEmail: 'refine-email',
      getFirefliesTranscript: 'get-fireflies-transcript',
      getFirefliesTranscriptById: 'get-fireflies-transcripts-byid',
      processSalesCall: 'process-call-data-ai-v2',
      cummulativeSalesData: 'cumulative-comm',
      userInvite: 'user-invite-dev',//dev
      userInviteProd: 'user-invite', //prod
      hubspotConnectionCheck: 'hubspotconnection-check',
      firefliesConnectionCheck: 'FF-check',
      getFirefliesFiles: 'get-FF-transcripts',
      vectorFileUpload: 'upload-rag',
      passwordReset: 'forgot-password-dev',//dev
      passwordResetProd: 'forgot-password', //prod
      getOwnersDetails: 'hub-all-owners',
      hubspotCompanies: 'hub-all-companies',
      hubspotDeals: 'hub-get-deals',
      hubspotDealNotes: 'hub-get-deals-notes',
      hubspotCompanyCreation: 'Hub-create-company',
      hubspotDealCreation: 'Hub-create-deal',
      cummulativeSalesInsights: 'Cumulative-insights',
      updateCompanyName: 'update-company',
      hubspotGetCompanyDetail: 'hub-get-company-detail',
      hubspotGetDealInfo: 'hub-get-deal-info',
      sendSlack: "Send-slack",
      fileUpload: 'upload-file-ai',
      brevoContact: 'User-contact',
      updateContact: 'Update_brevo-contact',
      cancelSubscriptionDev: 'Cancle-sub',
      cancelSubscriptionProd: 'Cancle-sub-prod',
      checkoutSubscriptionDev: 'checkout-session',
      checkoutSubscriptionProd: 'checkout-session-prod',
      organizationPlanDev: 'orgplan',
      organizationPlanProd: 'orgplan-prod',
      updateTeamSizeDev: 'update-team-size-dev',
      updateTeamSizeProd: 'update-team-size-prod',
      fathomConnectionCheck: 'Fathom-check',
      getFathomFiles: 'get-Fathom-transcripts',
      orgCancelSubscriptionDev: 'cancel-orgsub-dev',
      orgCancelSubscriptionProd: 'cancel-orgsub-prod',
      billingPreviewDev: 'billingPreview-dev',
      billingPreviewProd: 'billingPreview-prod',
      renewSubscriptionDev: 'renew-sub-dev',
      renewSubscriptionProd: 'renew-sub-prod',
      upgradePlanDev: 'upgrade-plan-dev',
      upgradePlanProd: 'upgrade-plan-prod',
      previewUpgradeDev: 'preview-upgrade-dev',
      previewUpgradeProd: 'preview-upgrade-prod',
      checkValidCouponDev: 'check_valid_coupon',
      checkValidCouponProd: 'check_valid_coupon',
    }
  }
};

// Validation function to check if required environment variables are set
export const validateConfig = () => {
  const requiredVars = [
    'VITE_HUBSPOT_CLIENT_ID',
    'VITE_HUBSPOT_CLIENT_SECRET',
    'VITE_POSTHOG_KEY'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missing.length > 0) {
    console.warn('Missing required environment variables:', missing);
    console.warn('Please check your .env file and ensure all required variables are set.');
  }

  return missing.length === 0;
};

// Initialize validation on import
if (import.meta.env.DEV) {
  validateConfig();
}