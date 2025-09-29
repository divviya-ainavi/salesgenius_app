@@ .. @@
 import { useSelector } from 'react-redux';
-import { supabase } from '@/lib/supabase';
 import { analytics } from '@/lib/analytics';

 export const usePlanRestrictions = () => {
-  const { user } = useSelector((state) => state.auth);
-  const [currentPlan, setCurrentPlan] = useState(null);
-  const [isLoading, setIsLoading] = useState(true);
-  const [error, setError] = useState(null);
-
-  // Load user's current plan on mount
-  useEffect(() => {
-    if (user?.id) {
-      loadCurrentPlan();
-    }
-  }, [user?.id]);
-
-  const loadCurrentPlan = async () => {
-    try {
-      setIsLoading(true);
-      setError(null);
-
-      // First, try to get from new user_plan table
-      const { data: userPlanData, error: userPlanError } = await supabase
-        .from('user_plan')
-        .select('*, plan_master(*)')
-        .eq('user_id', user.id)
-        .eq('is_active', true)
-        .eq('status', 'active')
-        .order('created_at', { ascending: false })
-        .limit(1);
-
-      if (!userPlanError && userPlanData && userPlanData.length > 0) {
-        const userPlan = userPlanData[0];
-        const planMaster = userPlan.plan_master;
-        
-        const endDate = new Date(userPlan.end_date);
-        const today = new Date();
-        const isExpired = endDate < today;
-        const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
-
-        const planDetails = {
-          ...userPlan,
-          ...planMaster,
-          isExpired,
-          daysRemaining,
-          planType: planMaster?.plan_name?.toLowerCase().includes('trial') || 
-                   planMaster?.plan_name?.toLowerCase().includes('beta') ||
-                   (planMaster?.price || 0) === 0 ? 'free' : 'paid',
-        };
-
-        setCurrentPlan(planDetails);
-        return;
-      }
-
-      // Fallback to legacy plan table
-      const { data: legacyPlanData, error: legacyPlanError } = await supabase
-        .from('plan')
-        .select('*')
-        .eq('user_id', user.id)
-        .order('created_at', { ascending: false })
-        .limit(1);
-
-      if (!legacyPlanError && legacyPlanData && legacyPlanData.length > 0) {
-        const plan = legacyPlanData[0];
-        const endDate = new Date(plan.end_date);
-        const today = new Date();
-        const isExpired = endDate < today;
-        const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
-
-        setCurrentPlan({
-          ...plan,
-          plan_name: plan.plan_name,
-          price: plan.plan_name === 'Beta Trial' ? 0 : 49,
-          isExpired,
-          daysRemaining,
-          planType: plan.plan_name?.toLowerCase().includes('trial') || 
-                   plan.plan_name?.toLowerCase().includes('beta') ? 'free' : 'paid',
-        });
-      } else {
-        setCurrentPlan(null);
-      }
-    } catch (err) {
-      console.error('Error loading plan:', err);
-      setError(err.message);
-      setCurrentPlan(null);
-    } finally {
-      setIsLoading(false);
-    }
-  };
+  const { user, currentPlan } = useSelector((state) => state.auth);

   // Check if user has access to premium features
   const hasFeatureAccess = useCallback((feature) => {
@@ .. @@
   return {
     currentPlan,
-    isLoading,
-    error,
+    isLoading: false, // Plan loading is handled in auth slice
+    error: null,
     hasFeatureAccess,
     canProcessResearch,
     canProcessCalls,
@@ -134,7 +54,6 @@ export const usePlanRestrictions = () => {
     canInviteUsers,
     isExpired,
     daysUntilExpiry,
-    refreshPlan: loadCurrentPlan,
   };
 };