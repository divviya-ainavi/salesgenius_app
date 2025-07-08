import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie'

const initialState = {
    storedProspectId: ""
};

const prospectSlice = createSlice({
    name: 'prospect',
    initialState,
    reducers: {
        setStoredProspectId: (state, action) => {
            state.storedProspectId = action.storedProspectId;
        },
    },
});

export const {
    setStoredProspectId
} = prospectSlice.actions;
export default prospectSlice.reducer;