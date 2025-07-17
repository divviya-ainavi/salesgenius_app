import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'

const initialState = {
    company_size: null,
    sales_methodology: null,
    industry: null,
    roles: null,
    allTitles: [],
    getUserslist: [],
    getOrgList: [],
    allStatus: [],
    insightTypes: [],
    communicationStyleTypes: [],
};

const orgSlice = createSlice({
    name: 'org',
    initialState,
    reducers: {
        setCompany_size: (state, action) => {
            state.company_size = action.payload;
        },
        setSales_methodology: (state, action) => {
            state.sales_methodology = action.payload;
        },
        setIndustry: (state, action) => {
            state.industry = action.payload;
        },
        setRoles: (state, action) => {
            state.roles = action.payload;
        },
        setAllTitles: (state, action) => {
            state.allTitles = action.payload;
        },
        setGetUsersList: (state, action) => {
            state.getUserslist = action.payload;
        },
        setGetOrgList: (state, action) => {
            state.getOrgList = action.payload;
        },
        setGetAllStatus: (state, action) => {
            state.allStatus = action.payload;
        },
        setInsightTypes: (state, action) => {
            state.insightTypes = action.payload
        },
        setCommunicationTypes: (state, action) => {
            state.communicationStyleTypes = action.payload
        },
        resetOrgState: (state) => {
            // Reset the entire state to initial values
            Object.assign(state, initialState);
        }
    },
});

export const {
    setCompany_size,
    setSales_methodology,
    setIndustry,
    setRoles,
    setAllTitles,
    resetOrgState,
    setGetUsersList,
    setGetOrgList,
    setGetAllStatus,
    setInsightTypes,
    setCommunicationTypes
} = orgSlice.actions;
export default orgSlice.reducer;