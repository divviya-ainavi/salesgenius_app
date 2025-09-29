import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const usePlanRestrictions = () => {
  const { user } = useSelector((state) => state.auth);
  const [planStatus, setPlanStatus] = useState({
    isExpired: false,
    planType: null,
    planName: null,
    daysRemaining: 0,
    isLoading: true,
  });

  useEffect(() => {
    checkPlanStatus();
  }, [user?.id]);

  const checkPlanStatus = async () => {
    if (!user?.id) {
      setPlanStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Check user_plan table first (new format)
      const { data: userPlanData, error: userPlanError } = await supabase
        .from("user_plan")
        .select(`
          *,
          plan_master (
            id,
            plan_name,
            description,
            price,
            currency,
            duration_days
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      let planData = null;

      if (!userPlanError && userPlanData && userPlanData.length > 0) {
        const userPlan = userPlanData[0];
        planData = {
          plan_name: userPlan.plan_master.plan_name,
          end_date: userPlan.end_date,
          price: userPlan.plan_master.price,
          status: userPlan.status,
        };
      } else {
        // Fallback to old plan table
        const { data: oldPlanData, error: oldPlanError } = await supabase
          .from("plan")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!oldPlanError && oldPlanData && oldPlanData.length > 0) {
          planData = oldPlanData[0];
        }
      }

      if (planData) {
        const endDate = new Date(planData.end_date);
        const today = new Date();
        const isExpired = endDate < today || planData.status === 'cancelled';
        const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

        const planName = planData.plan_name?.toLowerCase() || '';
        const isFree = planName.includes('free') || planName.includes('trial') || planName.includes('beta') || planData.price === 0;

        setPlanStatus({
          isExpired,
          planType: isFree ? 'free' : 'paid',
          planName: planData.plan_name,
          daysRemaining,
          isLoading: false,
        });
      } else {
        // No plan found - treat as expired free plan
        setPlanStatus({
          isExpired: true,
          planType: 'free',
          planName: 'No Plan',
          daysRemaining: 0,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking plan status:', error);
      setPlanStatus({
        isExpired: true,
        planType: 'free',
        planName: 'Unknown',
        daysRemaining: 0,
        isLoading: false,
      });
    }
  };

  // Feature restrictions based on plan status
  const restrictions = useMemo(() => {
    const { isExpired, planType } = planStatus;

    // If plan is expired (regardless of type), restrict all premium features
    if (isExpired) {
      return {
        canProcessResearch: false,
        canProcessTranscripts: false,
        canPushToHubspot: false,
        canGenerateEmails: false,
        canGeneratePresentations: false,
        canInviteUsers: false,
        canAccessAnalytics: false,
        canAccessSettings: true, // Always allow settings access
        restrictionReason: `Your ${planType === 'free' ? 'free trial' : 'subscription'} has expired. Please upgrade to continue using premium features.`,
      };
    }

    // If plan is active, allow all features
    return {
      canProcessResearch: true,
      canProcessTranscripts: true,
      canPushToHubspot: true,
      canGenerateEmails: true,
      canGeneratePresentations: true,
      canInviteUsers: true,
      canAccessAnalytics: true,
      canAccessSettings: true,
      restrictionReason: null,
    };
  }, [planStatus]);

  const showUpgradePrompt = (featureName) => {
    toast.error(
      `${featureName} is not available. ${restrictions.restrictionReason}`,
      {
        duration: 5000,
        action: {
          label: 'Upgrade Plan',
          onClick: () => {
            // Navigate to billing/upgrade page
            window.location.href = '/settings?tab=billing';
          },
        },
      }
    );
  };

  const checkFeatureAccess = (feature, featureName) => {
    if (!restrictions[feature]) {
      showUpgradePrompt(featureName);
      return false;
    }
    return true;
  };

  return {
    ...planStatus,
    restrictions,
    checkFeatureAccess,
    showUpgradePrompt,
    refreshPlanStatus: checkPlanStatus,
  };
};