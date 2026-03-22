import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { subscribeToPush } from '../../lib/pushManager'

interface NotificationState {
  unreadCount: number
  isSubscribed: boolean
  permission: NotificationPermission
}

const initialState: NotificationState = {
  unreadCount: 0,
  isSubscribed: false,
  permission: 'default'
}

// Subscribe to push notifications
export const initPushSubscription = createAsyncThunk(
  'notifications/subscribe',
  async () => {
    const subscription = await subscribeToPush()
    return !!subscription
  }
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    incrementUnread: (state) => {
      state.unreadCount += 1
    },
    resetUnread: (state) => {
      state.unreadCount = 0
    },
    setPermission: (state, action) => {
      state.permission = action.payload
    }
  },
  extraReducers: (builder) => {
    builder.addCase(initPushSubscription.fulfilled, (state, action) => {
      state.isSubscribed = action.payload
      state.permission = Notification.permission
    })
  }
})

export const { incrementUnread, resetUnread, setPermission } = notificationSlice.actions
export default notificationSlice.reducer