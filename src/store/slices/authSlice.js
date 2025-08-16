import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'

const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    isNewUser: true, // Added to track if user is new or existing
    onboardingComplete: false, // Added to track if onboarding is complete
    userProfileInfo: "",
    signupUser: null,
    resetEmail: null,
    userRole: null,
    userRoleId: null,
    titleName: null,
    organizationDetails: null,
    hubspotIntegration: {
        connected: false,
        lastSync: null,
        accountInfo: null,
        hubspotUserId: null,
    },
    ishavefirefliesData: false,
    firefliesData: [],
    hasSeenOnboardingTour: false
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        setSignupUser: (state, action) => {
            state.signupUser = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setIsNewUser: (state, action) => {
            state.isNewUser = action.payload;
        },
        setOnboardingComplete: (state, action) => {
            state.onboardingComplete = action.payload;
        },
        setUserProfileInfo: (state, action) => {
            state.userProfileInfo = action.payload
        },
        setIsAuthenticated: (state, action) => {
            state.isAuthenticated = action.payload
        },
        setResetEmail: (state, action) => {
            state.resetEmail = action.payload;
        },
        setUserRole: (state, action) => {
            state.userRole = action.payload;
        },
        setUserRoleId: (state, action) => {
            state.userRoleId = action.payload;
        },
        setTitleName: (state, action) => {
            state.titleName = action.payload;
        },
        setOrganizationDetails: (state, action) => {
            state.organizationDetails = action.payload;
        },
        setHubspotIntegration: (state, action) => {
            state.hubspotIntegration = action.payload;
        },
        setIshavefirefliesData: (state, action) => {
            state.ishavefirefliesData = action.payload;
        },
        setFirefliesData: (state, action) => {
            state.firefliesData = action.payload;
        },
        setHasSeenOnboardingTour: (state, action) => {
            state.hasSeenOnboardingTour = action.payload;
        },
        setHubspotUserId: (state, action) => {
            state.hubspotIntegration.hubspotUserId = action.payload;
        },
        resetAuthState: (state) => {
            // Reset the entire state to initial values
            Object.assign(state, initialState);
        }
    },
});

export const {
    setUser,
    setLoading,
    setError,
    resetAuthState,
    setIsNewUser,
    setOnboardingComplete,
    setUserProfileInfo,
    setIsAuthenticated,
    signupUser,
    setResetEmail,
    setUserRole,
    setUserRoleId,
    setTitleName,
    setOrganizationDetails,
    setHubspotIntegration,
    setIshavefirefliesData,
    setFirefliesData,
    setHasSeenOnboardingTour,
    setHubspotUserId
} = authSlice.actions;
export default authSlice.reducer;