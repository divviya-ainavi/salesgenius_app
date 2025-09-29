import { useSelector } from 'react-redux';
import { analytics } from '@/lib/analytics';

export const usePlanRestrictions = () => {
  const { user, currentPlan } = useSelector((state) => state.auth);

  // Check if user has access to premium features
  const hasFeatureAccess = useCallback((feature) => {
    if (!currentPlan) return false;
    
    // If plan is expired, no access to premium features
    if (currentPlan.isExpired) return false;
    
    // Free plans have limited access
    if (currentPlan.planType === 'free') {
      return ['basic_research', 'basic_calls'].includes(feature);
    }
    
    // Paid plans have full access
    return true;
  }, [currentPlan]);

  const canProcessResearch = useMemo(() => {
    return hasFeatureAccess('research');
  }, [hasFeatureAccess]);

  const canProcessCalls = useMemo(() => {
    return hasFeatureAccess('calls');
  }, [hasFeatureAccess]);

  const canInviteUsers = useMemo(() => {
    return hasFeatureAccess('invite_users');
  }, [hasFeatureAccess]);

  const isExpired = useMemo(() => {
    return currentPlan?.isExpired || false;
  }, [currentPlan]);

  const daysUntilExpiry = useMemo(() => {
    return currentPlan?.daysRemaining || 0;
  }, [currentPlan]);

  return {
    currentPlan,
    isLoading: false, // Plan loading is handled in auth slice
    error: null,
    hasFeatureAccess,
    canProcessResearch,
    canProcessCalls,
    canInviteUsers,
    isExpired,
    daysUntilExpiry,
  };
};