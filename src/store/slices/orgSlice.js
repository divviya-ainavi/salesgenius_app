import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'

const initialState = {
    company_size: null,
    sales_methodology: null,
    industry: null,
    roles: null,
    allTitles: []

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
        }
    },
});

export const {
    setCompany_size,
    setSales_methodology,
    setIndustry,
    setRoles,
    setAllTitles
} = orgSlice.actions;
export default orgSlice.reducer;