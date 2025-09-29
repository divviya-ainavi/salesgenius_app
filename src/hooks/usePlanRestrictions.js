import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { analytics } from '@/lib/analytics';

export const usePlanRestrictions = () => {
  const { currentPlan } = useSelector((state) => state.auth);

  // Check if user has access to premium features
  const hasFeatureAccess = useCallback((feature) => {
    if (!currentPlan) return false;
    
    // If plan is expired, no access to premium features
    if (currentPlan.isExpired) return false;
    
    // If plan is cancelled, no access to premium features
    if (currentPlan.status === 'cancelled') return false;
    
    // If plan is inactive, no access to premium features
    if (!currentPlan.is_active) return false;
    
    // All active, non-expired plans have full access
    return true;
  }, [currentPlan]);

  // Specific feature checks
  const canProcessResearch = useMemo(() => {
    return hasFeatureAccess('research');
  }, [hasFeatureAccess]);

  const canProcessCalls = useMemo(() => {
    return hasFeatureAccess('calls');
  }, [hasFeatureAccess]);

  const canPushToHubSpot = useMemo(() => {
    return hasFeatureAccess('hubspot_push');
  }, [hasFeatureAccess]);

  const canGenerateEmails = useMemo(() => {
    return hasFeatureAccess('email_generation');
  }, [hasFeatureAccess]);

  const canGeneratePresentations = useMemo(() => {
    return hasFeatureAccess('presentation_generation');
  }, [hasFeatureAccess]);

  const canInviteUsers = useMemo(() => {
    return hasFeatureAccess('invite_users');
  }, [hasFeatureAccess]);

  // Plan status checks
  const isExpired = useMemo(() => {
    return currentPlan?.isExpired || false;
  }, [currentPlan]);

  const isCancelled = useMemo(() => {
    return currentPlan?.status === 'cancelled';
  }, [currentPlan]);

  const isActive = useMemo(() => {
    return currentPlan?.is_active && currentPlan?.status === 'active' && !currentPlan?.isExpired;
  }, [currentPlan]);

  const daysUntilExpiry = useMemo(() => {
    return currentPlan?.daysRemaining || 0;
  }, [currentPlan]);

  const planType = useMemo(() => {
    return currentPlan?.planType || 'free';
  }, [currentPlan]);

  // Get restriction reason for UI display
  const getRestrictionReason = useCallback(() => {
    if (!currentPlan) return "No active plan found";
    if (currentPlan.isExpired) return "Your plan has expired";
    if (currentPlan.status === 'cancelled') return "Your plan has been cancelled";
    if (!currentPlan.is_active) return "Your plan is inactive";
    return "Plan restrictions apply";
  }, [currentPlan]);

  // Track when user hits a restriction
  const trackRestrictionHit = useCallback((feature) => {
    analytics.track('feature_restriction_hit', {
      feature,
      plan_name: currentPlan?.plan_name,
      plan_type: planType,
      is_expired: isExpired,
      is_cancelled: isCancelled,
      days_remaining: daysUntilExpiry,
    });
  }, [currentPlan, planType, isExpired, isCancelled, daysUntilExpiry]);

  return {
    currentPlan,
    hasFeatureAccess,
    canProcessResearch,
    canProcessCalls,
    canPushToHubSpot,
    canGenerateEmails,
    canGeneratePresentations,
    canInviteUsers,
    isExpired,
    isCancelled,
    isActive,
    daysUntilExpiry,
    planType,
    getRestrictionReason,
    trackRestrictionHit,
  };
};