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
    isNewUser: true,
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
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isNewUser = true;
            state.onboardingComplete = false;
            localStorage.clear();
            Cookies.remove("token");
            Cookies.remove("userid");
            state.hubspotIntegration = {
                connected: false,
                lastSync: null,
                accountInfo: null,
            };
        },
    },
});

export const {
    setUser,
    setLoading,
    setError,
    logout,
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
} = authSlice.actions;
export default authSlice.reducer;