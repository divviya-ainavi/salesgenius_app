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
    },
    ishavefirefliesData: false,
    firefliesData: [],
    authUserId: null
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
        setAuthUserId: (state, action) => {
            state.authUserId = action.payload;
            // Cookies.set('authUserId', action.payload, { expires: 7 }); // Store in cookies for persistence
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
    setAuthUserId
} = authSlice.actions;
export default authSlice.reducer;