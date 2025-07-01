import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics } from '@/lib/analytics'

// Custom hook for analytics integration
export const useAnalytics = () => {
  const location = useLocation()

  // Track page views automatically
  useEffect(() => {
    const pageName = getPageName(location.pathname)
    analytics.page(pageName, {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
    })
  }, [location])

  // Helper function to get readable page names
  const getPageName = useCallback((pathname) => {
    const routes = {
      '/': 'Home',
      '/research': 'Research',
      '/calls': 'Sales Calls',
      '/call-insights': 'Call Insights',
      '/follow-ups/actions': 'Action Items',
      '/follow-ups/emails': 'Email Templates',
      '/follow-ups/decks': 'Deck Builder',
      '/analytics': 'Analytics',
      '/settings': 'Settings',
    }
    
    return routes[pathname] || pathname.split('/').pop() || 'Unknown Page'
  }, [])

  // Memoized analytics functions
  const trackButtonClick = useCallback((buttonName, context = {}) => {
    analytics.trackButtonClick(buttonName, context)
  }, [])

  const trackFeatureUsage = useCallback((featureName, action, context = {}) => {
    analytics.trackFeatureUsage(featureName, action, context)
  }, [])

  const trackFileUpload = useCallback((fileName, fileSize, fileType, status = 'started') => {
    analytics.trackFileUpload(fileName, fileSize, fileType, status)
  }, [])

  const trackApiResponse = useCallback((endpoint, method, status, duration, error = null) => {
    analytics.trackApiResponse(endpoint, method, status, duration, error)
  }, [])

  const trackAiInteraction = useCallback((interactionType, inputType, outputType, success = true, context = {}) => {
    analytics.trackAiInteraction(interactionType, inputType, outputType, success, context)
  }, [])

  const trackProspectInteraction = useCallback((prospectId, prospectName, action, context = {}) => {
    analytics.trackProspectInteraction(prospectId, prospectName, action, context)
  }, [])

  const trackCrmIntegration = useCallback((action, platform = 'hubspot', success = true, context = {}) => {
    analytics.trackCrmIntegration(action, platform, success, context)
  }, [])

  return {
    trackButtonClick,
    trackFeatureUsage,
    trackFileUpload,
    trackApiResponse,
    trackAiInteraction,
    trackProspectInteraction,
    trackCrmIntegration,
    track: analytics.track,
    identify: analytics.identify,
    setUserProperties: analytics.setUserProperties,
  }
}

// Hook for tracking API calls
export const useApiTracking = () => {
  const trackApiCall = useCallback(async (apiCall, endpoint, method = 'GET') => {
    const startTime = Date.now()
    
    try {
      const result = await apiCall()
      const duration = Date.now() - startTime
      
      analytics.trackApiResponse(endpoint, method, 200, duration)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const status = error.response?.status || 500
      
      analytics.trackApiResponse(endpoint, method, status, duration, error.message)
      throw error
    }
  }, [])

  return { trackApiCall }
}

// Hook for tracking form submissions
export const useFormTracking = () => {
  const trackFormSubmission = useCallback((formName, formData = {}, success = true) => {
    analytics.trackFormSubmission(formName, formData, success)
  }, [])

  return { trackFormSubmission }
}