import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'

const initialState = {
    storedProspectId: "",
    cummulativeSpinner: false,
    callInsightSelectedId: ""
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
        setCallInsightSelectedId: (state, action) => {
            state.callInsightSelectedId = action.payload;
        }
    },
});

export const {
    setStoredProspectId,
    setCummulativeSpin,
    setCallInsightSelectedId
} = prospectSlice.actions;
export default prospectSlice.reducer;