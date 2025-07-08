import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // uses localStorage
import { persistStore, persistReducer } from "redux-persist";

// Reducers
import authReducer from "./slices/authSlice";
import orgReducer from "./slices/orgSlice";
import prospectReducer from "./slices/prospectSlice";


// Define unique persist configs for each slice
const authPersistConfig = {
    key: "auth",
    storage,
};

const orgPersistConfig = {
    key: "org",
    storage,
};


const prospectPersistConfig = {
    key: "prospect",
    storage,
};
// Wrap reducers with persistReducer
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const orPersistedgReducer = persistReducer(orgPersistConfig, orgReducer);
const prospectPersistedgReducer = persistReducer(prospectPersistConfig, prospectReducer);

// Create the store
export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
        org: orPersistedgReducer,
        prospect: prospectPersistedgReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // recommended for redux-persist
        }),
});

// Create persistor
export const persistor = persistStore(store);
