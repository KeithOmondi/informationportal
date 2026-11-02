import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  type Action,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "../../api/axios";

// ==========================
// Types
// ==========================
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "judge" | "dr";
}

export interface Message {
  _id: string;
  sender: User | string;
  receiver?: User | string;
  group?: string;
  text?: string;
  imageUrl?: string;
  senderType: "admin" | "judge" | "dr";
  isBroadcast?: boolean;
  audience?: "JUDGES" | "DR" | "ALL";
  readBy: string[];
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
  unreadCount?: number;
}

interface UserChatState {
  groups: Group[];
  chatMessages: Message[];
  loading: boolean;
  error?: string;
}

// Backend response wrapper
interface ChatResponse<T> {
  success: boolean;
  data: T;
  message?: string;
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

export const markThreadAsRead = createAsyncThunk<
  { channelId: string },
  { type: "broadcast" | "private" },
  { rejectValue: string }
>("userChat/markThreadAsRead", async (payload, { rejectWithValue }) => {
  try {
    await api.patch("/chat/read-thread", payload);
    const channelId =
      payload.type === "broadcast" ? "global_broadcast" : "admin_private";
    return { channelId };
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      return rejectWithValue(err.response?.data?.message || "Failed to mark as read");
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

export const fetchUserMessages = createAsyncThunk<
  Message[],
  { receiver?: string; group?: string; isBroadcast?: boolean },
  { rejectValue: string }
>("userChat/fetchUserMessages", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get<ChatResponse<Message[]>>("/chat/messages", { params });
    return data.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

export const fetchUserGroups = createAsyncThunk<
  Group[],
  void,
  { rejectValue: string }
>("userChat/fetchUserGroups", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<ChatResponse<Group[]>>("/chat/my-groups");
    return data.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      return rejectWithValue(err.response?.data?.message || "Groups fetch failed");
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

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

        const channelId = action.payload.isBroadcast
          ? "global_broadcast"
          : "admin_private";

        const group = state.groups.find((g) => g._id === channelId);
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
        state.chatMessages = action.payload;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
      })
      .addCase(markThreadAsRead.fulfilled, (state, action) => {
        const group = state.groups.find((g) => g._id === action.payload.channelId);
        if (group) {
          group.unreadCount = 0;
        }
      })
      /* Matchers */
      .addMatcher(
        (action: Action): action is Action => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = undefined;
        }
      )
      .addMatcher(
        (action: Action): action is PayloadAction<string> =>
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          // Action payload is now safely typed as string via rejectValue
          state.error = action.payload || "Error";
        }
      )
      .addMatcher(
        (action: Action): action is Action => action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        }
      );
  },
});

export const { receiveMessage, resetChatMessages } = userChatSlice.actions;
export default userChatSlice.reducer;