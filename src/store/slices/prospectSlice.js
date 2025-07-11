import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'

const initialState = {
    storedProspectId: "",
    cummulativeSpinner: false
};

const prospectSlice = createSlice({
    name: 'prospect',
    initialState,
    reducers: {
        setStoredProspectId: (state, action) => {
            state.storedProspectId = action.payload;
        },
        setCummulativeSpin: (state, action) => {
            state.cummulativeSpinner = action.payload;
        },
    },
});

export const {
    setStoredProspectId,
    setCummulativeSpin
} = prospectSlice.actions;
export default prospectSlice.reducer;