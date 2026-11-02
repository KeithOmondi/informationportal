import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "../../api/axios";

// Helper to convert VAPID string to Uint8Array for the browser
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PushState = {
  permission: "Notification" in window ? Notification.permission : "default",
  isSubscribed: false,
  loading: false,
  error: null,
};

// Generics: <ReturnedType, ArgType, ConfigType>
export const subscribeUserToPush = createAsyncThunk<
  NotificationPermission,
  void,
  { rejectValue: string }
>(
  "push/subscribe",
  async (_, { rejectWithValue }) => {
    try {
      // 1. Check browser support
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Browser does not support desktop alerts.");
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 3. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permission for alerts was denied.");
      }

      // 4. Create Subscription
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("VAPID Public Key is missing in environment variables.");
      }

      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // 5. Send to Backend Route
      await api.post("/users/subscribe", { subscription });

      return permission;
    } catch (err: unknown) {
      // Handle Axios errors vs standard Error objects safely
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Server subscription failed");
      }
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

const pushSlice = createSlice({
  name: "push",
  initialState,
  reducers: {
    updatePermission: (state) => {
      state.permission = Notification.permission;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeUserToPush.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        subscribeUserToPush.fulfilled,
        (state, action: PayloadAction<NotificationPermission>) => {
          state.loading = false;
          state.permission = action.payload;
          state.isSubscribed = true;
        }
      )
      .addCase(subscribeUserToPush.rejected, (state, action) => {
        state.loading = false;
        // action.payload is now recognized as string | undefined due to rejectValue config
        state.error = action.payload ?? "Failed to subscribe";
      });
  },
});

export const { updatePermission } = pushSlice.actions;
export default pushSlice.reducer;