import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  type Action,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// ==========================
// Types
// ==========================
export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Message {
  _id: string;
  sender: User | string;
  receiver?: User | string;
  group?: string;
  text?: string;
  imageUrl?: string;
  senderType: "admin" | "judge" | "guest";
  isBroadcast?: boolean;
  readBy: string[]; // Now the source of truth for "read" status
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  members: User[] | string[];
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  isReadOnly?: boolean;
  type?: "group" | "broadcast" | "private";
  unreadCount?: number; // Added to support sidebar badges
}

interface UserChatState {
  groups: Group[];
  chatMessages: Message[];
  loading: boolean;
  error?: string;
}

const initialState: UserChatState = {
  chatMessages: [],
  groups: [],
  loading: false,
  error: undefined,
};

// ==========================
// Async Thunks
// ==========================

/**
 * Marks an entire thread as read on the server.
 * Dispatch this when a user clicks on a channel.
 */
export const markThreadAsRead = createAsyncThunk<
  { channelId: string },
  { channelId: string; type: "broadcast" | "private" | "group" }
>("userChat/markThreadAsRead", async (payload, { rejectWithValue }) => {
  try {
    await api.patch("/chat/read-thread", payload);
    return { channelId: payload.channelId };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to mark as read");
  }
});

export const fetchUserMessages = createAsyncThunk<
  Message[],
  { receiver?: string; group?: string; isBroadcast?: boolean }
>("userChat/fetchUserMessages", async (params, { rejectWithValue }) => {
  try {
    // Note: Updated to match your general message fetching endpoint
    const { data } = await api.get("/chat/messages", { params });
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
  }
});

export const fetchUserGroups = createAsyncThunk<Group[]>(
  "userChat/fetchUserGroups",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/chat/my-groups");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Groups fetch failed");
    }
  },
);

// ==========================
// Slice
// ==========================
const userChatSlice = createSlice({
  name: "userChat",
  initialState,
  reducers: {
    receiveMessage(state, action: PayloadAction<Message>) {
      if (!action.payload?._id) return;

      const exists = state.chatMessages.find((m) => m._id === action.payload._id);
      if (!exists) {
        state.chatMessages.push(action.payload);

        // UI Logic: Find the group/channel this message belongs to and increment its unread count
        const channelId = action.payload.isBroadcast 
          ? "global_broadcast" 
          : "admin_private";

        const group = state.groups.find(g => g._id === channelId);
        if (group) {
          group.unreadCount = (group.unreadCount || 0) + 1;
        }
      }
    },
    resetChatMessages(state) {
      state.chatMessages = [];
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserMessages.fulfilled, (state, action) => {
        state.chatMessages = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
      })
      .addCase(markThreadAsRead.fulfilled, (state, action) => {
        // Find the channel in state and reset its unread count to 0 locally
        const group = state.groups.find(g => g._id === action.payload.channelId);
        if (group) {
          group.unreadCount = 0;
        }
      })
      /* Matchers for Loading/Error States */
      .addMatcher(
        (action: Action): action is Action => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = undefined;
        },
      )
      .addMatcher(
        (action: Action): action is PayloadAction<string> =>
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = typeof action.payload === "string" 
            ? action.payload 
            : "An unexpected error occurred";
        },
      )
      .addMatcher(
        (action: Action): action is Action => action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        },
      );
  },
});

export const { receiveMessage, resetChatMessages } = userChatSlice.actions;
export default userChatSlice.reducer;