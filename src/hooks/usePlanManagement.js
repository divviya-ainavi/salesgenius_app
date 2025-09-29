import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { setCurrentPlan, setPlanLoading, setPlanError } from '@/store/slices/authSlice';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';

export const usePlanManagement = () => {
  const dispatch = useDispatch();
  const { user, currentPlan, planLoading, planError } = useSelector((state) => state.auth);

  // Load user's current active plan
  const loadCurrentPlan = useCallback(async (userId = user?.id) => {
    if (!userId) {
      console.warn('No user ID provided for plan loading');
      return null;
    }

    dispatch(setPlanLoading(true));
    dispatch(setPlanError(null));

    try {
      console.log('🔄 Loading current plan for user:', userId);

      // First, try to get from new user_plan table with plan_master details
      const { data: userPlanData, error: userPlanError } = await supabase
        .from('user_plan')
        .select(`
          *,
          plan_master (
            id,
            plan_name,
            description,
            price,
            currency,
            duration_days,
            features
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!userPlanError && userPlanData && userPlanData.length > 0) {
        const userPlan = userPlanData[0];
        const planMaster = userPlan.plan_master;

        // Calculate plan status
        const endDate = new Date(userPlan.end_date);
        const today = new Date();
        const isExpired = endDate < today;
        const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

        const planDetails = {
          // User plan details
          id: userPlan.id,
          user_id: userPlan.user_id,
          plan_id: userPlan.plan_id,
          start_date: userPlan.start_date,
          end_date: userPlan.end_date,
          is_active: userPlan.is_active,
          status: userPlan.status,
          
          // Stripe payment details
          stripe_subscription_id: userPlan.stripe_subscription_id,
          stripe_customer_id: userPlan.stripe_customer_id,
          invoice_number: userPlan.invoice_number,
          invoice_id: userPlan.invoice_id,
          charge_id: userPlan.charge_id,
          amount: userPlan.amount,
          currency: userPlan.currency,
          invoice_pdf: userPlan.invoice_pdf,
          hosted_invoice_url: userPlan.hosted_invoice_url,
          receipt_url: userPlan.receipt_url,
          
          // Plan master details
          plan_name: planMaster?.plan_name || userPlan.plan_name,
          description: planMaster?.description,
          price: planMaster?.price || userPlan.amount,
          duration_days: planMaster?.duration_days,
          features: planMaster?.features || [],
          
          // Calculated fields
          isExpired,
          daysRemaining,
          renewalDate: endDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          
          // Plan type classification
          planType: planMaster?.plan_name?.toLowerCase().includes('trial') || 
                   planMaster?.plan_name?.toLowerCase().includes('beta') ||
                   (planMaster?.price || 0) === 0 ? 'free' : 'paid',
        };

        console.log('✅ Loaded plan from user_plan table:', {
          planName: planDetails.plan_name,
          isExpired: planDetails.isExpired,
          daysRemaining: planDetails.daysRemaining,
          planType: planDetails.planType,
        });

        dispatch(setCurrentPlan(planDetails));
        
        analytics.track('plan_loaded', {
          plan_name: planDetails.plan_name,
          plan_type: planDetails.planType,
          is_expired: planDetails.isExpired,
          days_remaining: planDetails.daysRemaining,
        });

        return planDetails;
      }

      // Fallback to legacy plan table
      console.log('📋 No active plan found in user_plan table, checking legacy plan table...');
      
      const { data: legacyPlanData, error: legacyPlanError } = await supabase
        .from('plan')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!legacyPlanError && legacyPlanData && legacyPlanData.length > 0) {
        const plan = legacyPlanData[0];
        const endDate = new Date(plan.end_date);
        const today = new Date();
        const isExpired = endDate < today;
        const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

        const legacyPlanDetails = {
          // Legacy plan details
          id: plan.id,
          user_id: plan.user_id,
          plan_name: plan.plan_name,
          start_date: plan.start_date,
          end_date: plan.end_date,
          duration_days: plan.no_of_days,
          
          // Default values for missing fields
          is_active: true,
          status: 'active',
          price: plan.plan_name === 'Beta Trial' ? 0 : 49,
          currency: 'usd',
          features: [],
          
          // Calculated fields
          isExpired,
          daysRemaining,
          renewalDate: endDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          
          // Plan type classification
          planType: plan.plan_name?.toLowerCase().includes('trial') || 
                   plan.plan_name?.toLowerCase().includes('beta') ? 'free' : 'paid',
        };

        console.log('✅ Loaded legacy plan:', {
          planName: legacyPlanDetails.plan_name,
          isExpired: legacyPlanDetails.isExpired,
          daysRemaining: legacyPlanDetails.daysRemaining,
          planType: legacyPlanDetails.planType,
        });

        dispatch(setCurrentPlan(legacyPlanDetails));
        
        analytics.track('legacy_plan_loaded', {
          plan_name: legacyPlanDetails.plan_name,
          plan_type: legacyPlanDetails.planType,
          is_expired: legacyPlanDetails.isExpired,
          days_remaining: legacyPlanDetails.daysRemaining,
        });

        return legacyPlanDetails;
      }

      // No plan found
      console.log('📭 No active plan found for user');
      dispatch(setCurrentPlan(null));
      return null;

    } catch (error) {
      console.error('❌ Error loading current plan:', error);
      dispatch(setPlanError(error.message));
      
      analytics.track('plan_load_failed', {
        user_id: userId,
        error: error.message,
      });
      
      throw error;
    } finally {
      dispatch(setPlanLoading(false));
    }
  }, [dispatch, user?.id]);

  // Update plan after upgrade
  const handlePlanUpgrade = useCallback(async (newPlanData) => {
    try {
      console.log('🔄 Handling plan upgrade:', newPlanData);
      
      // Reload the current plan to get updated data
      await loadCurrentPlan();
      
      analytics.track('plan_upgraded', {
        old_plan: currentPlan?.plan_name,
        new_plan: newPlanData.plan_name,
        user_id: user?.id,
      });
      
      toast.success(`Successfully upgraded to ${newPlanData.plan_name}!`);
      
    } catch (error) {
      console.error('❌ Error handling plan upgrade:', error);
      toast.error('Failed to update plan information');
    }
  }, [loadCurrentPlan, currentPlan, user?.id]);

  // Update plan after cancellation
  const handlePlanCancellation = useCallback(async () => {
    try {
      console.log('🔄 Handling plan cancellation');
      
      // Reload the current plan to get updated status
      await loadCurrentPlan();
      
      analytics.track('plan_cancelled', {
        plan_name: currentPlan?.plan_name,
        user_id: user?.id,
      });
      
      toast.success('Plan cancelled successfully');
      
    } catch (error) {
      console.error('❌ Error handling plan cancellation:', error);
      toast.error('Failed to update plan information');
    }
  }, [loadCurrentPlan, currentPlan, user?.id]);

  // Check if user has access to a specific feature
  const hasFeatureAccess = useCallback((feature) => {
    if (!currentPlan) return false;
    if (currentPlan.isExpired) return false;
    if (currentPlan.status !== 'active') return false;
    
    // All features are available for active, non-expired plans
    return true;
  }, [currentPlan]);

  // Get plan status for UI display
  const getPlanStatus = useCallback(() => {
    if (!currentPlan) {
      return {
        status: 'no_plan',
        message: 'No active plan found',
        canUseFeatures: false,
      };
    }

    if (currentPlan.isExpired) {
      return {
        status: 'expired',
        message: `Plan expired on ${currentPlan.renewalDate}`,
        canUseFeatures: false,
      };
    }

    if (currentPlan.status === 'cancelled') {
      return {
        status: 'cancelled',
        message: `Plan cancelled, access until ${currentPlan.renewalDate}`,
        canUseFeatures: true, // Still have access until end date
      };
    }

    if (currentPlan.daysRemaining <= 7) {
      return {
        status: 'expiring_soon',
        message: `Plan expires in ${currentPlan.daysRemaining} days`,
        canUseFeatures: true,
      };
    }

    return {
      status: 'active',
      message: `Plan active until ${currentPlan.renewalDate}`,
      canUseFeatures: true,
    };
  }, [currentPlan]);

  return {
    currentPlan,
    planLoading,
    planError,
    loadCurrentPlan,
    handlePlanUpgrade,
    handlePlanCancellation,
    hasFeatureAccess,
    getPlanStatus,
  };
};

export default usePlanManagement;