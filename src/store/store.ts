// admin/src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { injectLogout } from "../api/axios"; // Import the injector
import { clearUser } from "./slices/adminAuthSlice"; // Import the clear action

import authReducer from "./slices/adminAuthSlice";
import adminChatReducer from "./slices/adminMessageSlice";
import usersReducer from "./slices/adminUserSlice";
import filesReducer from "./slices/filesSlice";
import courtReducer from "./slices/courtInformationSlice";
import guestReducer from "./slices/guestSlice";
import noticesReducer from "./slices/noticeSlice";
import eventsReducer from "./slices/eventSlice";
import userChatReducer from "./slices/userChatSlice";
import pushReducer from "./slices/pushSlice";
import ceremonyReducer from "./slices/swearingPreferenceSlice";
import galleryReducer from "./slices/gallerySlice";
import programReducer from "./slices/programSlice";
import presentationsReducer from "./slices/presentationSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminChat: adminChatReducer,
    users: usersReducer,
    files: filesReducer,
    court: courtReducer,
    guest: guestReducer,
    notices: noticesReducer,
    events: eventsReducer,
    userChat: userChatReducer,
    push: pushReducer,
    ceremony: ceremonyReducer,
    gallery: galleryReducer,
    program: programReducer,
    presentations: presentationsReducer
  },
});

/* =====================================================
    LINK INTERCEPTOR TO STORE
   ===================================================== */
// This injects the ability to clear the user state directly 
// from the axios interceptor when a session expires.
injectLogout(() => {
  store.dispatch(clearUser());
});

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;