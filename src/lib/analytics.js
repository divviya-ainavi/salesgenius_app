import posthog from 'posthog-js'
import { config } from './config'

// PostHog configuration
const POSTHOG_CONFIG = {
  api_host: config.posthog.apiHost,
  api_key: config.posthog.apiKey,
  // Additional configuration options
  loaded: (posthog) => {
    if (import.meta.env.DEV) {
      console.log('PostHog loaded successfully')
    }
  },
  capture_pageview: true, // Automatically capture page views
  capture_pageleave: true, // Capture when users leave pages
  persistence: 'localStorage', // Use localStorage for persistence
  cross_subdomain_cookie: false,
  secure_cookie: true,
  disable_session_recording: false, // Enable session recordings
  session_recording: {
    maskAllInputs: true, // Mask sensitive inputs
    maskInputOptions: {
      password: true,
      email: false,
    },
  },
}

// Initialize PostHog
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined') {
    if (!config.posthog.apiKey) {
      console.warn('PostHog API key not found. Analytics will not be initialized.');
      return;
    }

    posthog.init(POSTHOG_CONFIG.api_key, {
      api_host: POSTHOG_CONFIG.api_host,
      ...POSTHOG_CONFIG,
    })
  }
}

// Analytics helper functions
export const analytics = {
  // Page/Screen tracking
  page: (pageName, properties = {}) => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
      ...properties,
    })
  },

  // User identification - now dynamic
  identify: (userId, traits = {}) => {
    if (userId) {
      if (!config.posthog.apiKey) {
        console.warn('PostHog not initialized. Skipping user identification.');
        return;
      }
      posthog.identify(traits?.email, traits)
      // console.log('PostHog: User identified', { userId, traits })
    }
  },

  // Event tracking
  track: (eventName, properties = {}) => {
    if (!config.posthog.apiKey) {
      console.warn('PostHog not initialized. Skipping event tracking.');
      return;
    }
    posthog.capture(eventName, {
      timestamp: new Date().toISOString(),
      ...properties,
    })
  },

  // Button click tracking
  trackButtonClick: (buttonName, context = {}) => {
    posthog.capture('button_clicked', {
      button_name: buttonName,
      page: window.location.pathname,
      ...context,
    })
  },

  // Navigation tracking
  trackNavigation: (from, to, method = 'click') => {
    posthog.capture('navigation', {
      from_page: from,
      to_page: to,
      navigation_method: method,
      timestamp: new Date().toISOString(),
    })
  },

  // File upload tracking
  trackFileUpload: (fileName, fileSize, fileType, status = 'started') => {
    posthog.capture('file_upload', {
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      upload_status: status,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    })
  },

  // API response tracking
  trackApiResponse: (endpoint, method, status, duration, error = null) => {
    posthog.capture('api_response', {
      endpoint,
      method,
      status_code: status,
      response_time_ms: duration,
      success: status >= 200 && status < 300,
      error_message: error,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    })
  },

  // Form submission tracking
  trackFormSubmission: (formName, formData = {}, success = true) => {
    posthog.capture('form_submission', {
      form_name: formName,
      success,
      page: window.location.pathname,
      ...formData,
    })
  },

  // Feature usage tracking
  trackFeatureUsage: (featureName, action, context = {}) => {
    posthog.capture('feature_usage', {
      feature_name: featureName,
      action,
      page: window.location.pathname,
      ...context,
    })
  },

  // AI interaction tracking
  trackAiInteraction: (interactionType, inputType, outputType, success = true, context = {}) => {
    posthog.capture('ai_interaction', {
      interaction_type: interactionType, // e.g., 'generate_email', 'analyze_call'
      input_type: inputType, // e.g., 'transcript', 'user_prompt'
      output_type: outputType, // e.g., 'email_template', 'insights'
      success,
      page: window.location.pathname,
      ...context,
    })
  },

  // Prospect interaction tracking
  trackProspectInteraction: (prospectId, prospectName, action, context = {}) => {
    posthog.capture('prospect_interaction', {
      prospect_id: prospectId,
      prospect_name: prospectName,
      action, // e.g., 'selected', 'generated_email', 'pushed_to_hubspot'
      page: window.location.pathname,
      ...context,
    })
  },

  // CRM integration tracking
  trackCrmIntegration: (action, platform = 'hubspot', success = true, context = {}) => {
    posthog.capture('crm_integration', {
      action, // e.g., 'push_email', 'push_commitments', 'sync_data'
      platform,
      success,
      page: window.location.pathname,
      ...context,
    })
  },

  // User properties
  setUserProperties: (properties) => {
    posthog.people.set(properties)
  },

  // Group analytics (for organizations)
  setGroup: (groupType, groupKey, groupProperties = {}) => {
    posthog.group(groupType, groupKey, groupProperties)
  },

  // Reset user (for logout)
  reset: () => {
    if (!config.posthog.apiKey) {
      console.warn('PostHog not initialized. Skipping reset.');
      return;
    }
    posthog.reset()
    // console.log('PostHog: User session reset')
  },

  // Get feature flags
  getFeatureFlag: (flagKey) => {
    return posthog.getFeatureFlag(flagKey)
  },

  // Check if feature flag is enabled
  isFeatureEnabled: (flagKey) => {
    return posthog.isFeatureEnabled(flagKey)
  },
}

// Export PostHog instance for advanced usage
export { posthog }

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializeAnalytics()
}