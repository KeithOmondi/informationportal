import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { subscribeToPush } from '../../lib/pushManager';

// Define what a notification looks like
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'NOTICE' | 'EVENT';
  hasAttachment: boolean;
  attachmentType?: string; // e.g., 'image/png' or 'application/pdf'
  timestamp: string;
}

interface NotificationState {
  unreadCount: number;
  isSubscribed: boolean;
  permission: NotificationPermission;
  recentNotifications: NotificationItem[];
}

const initialState: NotificationState = {
  unreadCount: 0,
  isSubscribed: false,
  permission: typeof window !== 'undefined' ? Notification.permission : 'default',
  recentNotifications: []
};

export const initPushSubscription = createAsyncThunk(
  'notifications/subscribe',
  async () => {
    const subscription = await subscribeToPush();
    return !!subscription;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // When a push notification is received while the app is open
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.recentNotifications.unshift(action.payload);
      state.unreadCount += 1;
      // Keep only last 20 notifications
      if (state.recentNotifications.length > 20) {
        state.recentNotifications.pop();
      }
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
    setPermission: (state, action: PayloadAction<NotificationPermission>) => {
      state.permission = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initPushSubscription.fulfilled, (state, action) => {
      state.isSubscribed = action.payload;
      state.permission = Notification.permission;
    });
  }
});

export const { addNotification, incrementUnread, resetUnread, setPermission } = notificationSlice.actions;
export default notificationSlice.reducer;