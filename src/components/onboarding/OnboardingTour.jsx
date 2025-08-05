import { useSelector, useDispatch } from 'react-redux';
import { dbHelpers } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import { setHasSeenOnboardingTour } from '@/store/slices/authSlice';

export const OnboardingTour = () => {
  const dispatch = useDispatch();
  const { user, hasSeenOnboardingTour } = useSelector((state) => state.auth);
  const location = useLocation();
  
  const [run, setRun] = useState(false);
  
  // Check if tour should run
  useEffect(() => {
    const shouldRunTour = () => {
      if (!user || hasSeenOnboardingTour) {
        return false;
      }
    };
  });
  
  const handleTourComplete = async () => {
    try {
      await dbHelpers.updateOnboardingTourStatus(user.id, true);
      
      // Update Redux state  
      dispatch(setHasSeenOnboardingTour(true));
      
      analytics.track('onboarding_tour_completed', {
      });
    } catch (error) {
    }
  };
};