@@ .. @@
 import { useSelector, useDispatch } from 'react-redux';
 import { dbHelpers } from '@/lib/supabase';
 import { analytics } from '@/lib/analytics';
-import { setUser } from '@/store/slices/authSlice';
+import { setHasSeenOnboardingTour } from '@/store/slices/authSlice';

 export const OnboardingTour = () => {
   const dispatch = useDispatch();
-  const { user } = useSelector((state) => state.auth);
+  const { user, hasSeenOnboardingTour } = useSelector((state) => state.auth);
   const location = useLocation();
   
   const [run, setRun] = useState(false);
@@ .. @@
   // Check if tour should run
   useEffect(() => {
     const shouldRunTour = () => {
-      if (!user || user.has_seen_onboarding_tour) {
+      if (!user || hasSeenOnboardingTour) {
         return false;
       }
@@ .. @@
       try {
         await dbHelpers.updateOnboardingTourStatus(user.id, true);
         
-        // Update Redux state
-        dispatch(setUser({
-          ...user,
-          has_seen_onboarding_tour: true
-        }));
+        // Update Redux state  
+        dispatch(setHasSeenOnboardingTour(true));
         
         analytics.track('onboarding_tour_completed', {