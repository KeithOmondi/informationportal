import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
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
  isActive: boolean;
}

export interface Message {
  _id: string;
  sender: User | string;
  receiver?: User | string;
  group?: string;
  text?: string;
  imageUrl?: string;
  senderType: "admin" | "user" | "judge";
  readBy: string[];
  status: "sent" | "delivered" | "read";
  isEdited?: boolean;
  isDeleted?: boolean;
  isBroadcast?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  members: User[] | string[];
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminChatState {
  messages: Message[];      // System-wide logs
  chatMessages: Message[];  // Active thread messages
  unreadCount: number;      // Tracking for Header notifications
  groups: Group[];
  stats: Record<string, any>;
  loading: boolean;
  sending: boolean;         // Specific state for message sending
  error?: string;
  totalMessages: number;
  page: number;
  pages: number;
}

const initialState: AdminChatState = {
  messages: [],
  chatMessages: [],
  unreadCount: 0,
  groups: [],
  stats: {},
  loading: false,
  sending: false,
  error: undefined,
  totalMessages: 0,
  page: 1,
  pages: 1,
};

// ==========================
// Async Thunks
// ==========================

export const fetchAllMessages = createAsyncThunk<
  { messages: Message[]; total: number; page: number; pages: number },
  { page?: number; limit?: number; isBroadcast?: boolean; receiverId?: string }
>("adminChat/fetchAllMessages", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/chat/admin/messages", { params });
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch logs");
  }
});

export const fetchChatMessages = createAsyncThunk<
  { messages: Message[]; total: number; page: number; pages: number },
  { receiverId?: string; groupId?: string; isBroadcast?: boolean; page?: number; limit?: number }
>("adminChat/fetchChatMessages", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/chat/admin/messages", { params });
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch thread");
  }
});

export const sendMessage = createAsyncThunk<
  Message | Message[],
  {
    receivers?: string[];
    receiver?: string;
    text?: string;
    image?: File;
    isBroadcast?: boolean;
    groupId?: string;
  }
>("adminChat/sendMessage", async (payload, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    if (payload.text) formData.append("text", payload.text);
    if (payload.image) formData.append("image", payload.image);

    if (payload.isBroadcast) {
      formData.append("isBroadcast", "true");
    } else if (payload.groupId) {
      formData.append("group", payload.groupId);
    } else if (payload.receivers && payload.receivers.length > 0) {
      payload.receivers.forEach(id => formData.append("receivers", id));
    } else if (payload.receiver) {
      formData.append("receiver", payload.receiver);
    } else {
      return rejectWithValue("Please select a recipient.");
    }

    const { data } = await api.post("/chat/admin/send", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to send message");
  }
});

export const fetchAdminGroups = createAsyncThunk<Group[]>(
  "adminChat/fetchGroups",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/chat/admin/groups");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch groups");
    }
  }
);

export const createAdminGroup = createAsyncThunk<
  Group,
  { name: string; description?: string; members?: string[] }
>("adminChat/createGroup", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/chat/admin/groups", payload);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Group creation failed");
  }
});

export const purgeMessagePermanently = createAsyncThunk(
  "adminChat/purgeMessage",
  async (messageId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/chat/admin/messages/${messageId}/purge`);
      return messageId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Purge failed");
    }
  }
);

export const fetchStats = createAsyncThunk<Record<string, any>>(
  "adminChat/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/chat/admin/stats");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Stats unavailable");
    }
  }
);

// ==========================
// Slice
// ==========================
const adminChatSlice = createSlice({
  name: "adminChat",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = undefined;
    },
    resetChatMessages: (state) => {
      state.chatMessages = [];
      state.page = 1;
      state.pages = 1;
    },
    // RESTORED: Needed by AdminHeader.tsx
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const msg = action.payload;
      if (!msg?._id) return;

      const inThread = state.chatMessages.some((m) => m._id === msg._id);
      if (!inThread) {
        state.chatMessages.push(msg);
        // Increment unread if message is from a user/judge and not current admin
        if (msg.senderType !== "admin") state.unreadCount += 1;
      }

      const inLogs = state.messages.some((m) => m._id === msg._id);
      if (!inLogs) state.messages.unshift(msg);
    },
  },
  extraReducers: (builder) => {
    builder
      /* 1. SPECIFIC CASES (.addCase) */
      .addCase(fetchAllMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.totalMessages = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.chatMessages = action.payload.messages;
        state.totalMessages = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const incoming = Array.isArray(action.payload) ? action.payload : [action.payload];
        incoming.forEach((msg) => {
          if (!state.chatMessages.some((m) => m._id === msg._id)) {
            state.chatMessages.push(msg);
          }
        });
      })
      .addCase(fetchAdminGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(createAdminGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.unshift(action.payload);
      })
      .addCase(purgeMessagePermanently.fulfilled, (state, action) => {
        state.chatMessages = state.chatMessages.filter(m => m._id !== action.payload);
        state.messages = state.messages.filter(m => m._id !== action.payload);
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      /* 2. GENERAL MATCHERS (.addMatcher) */
      .addMatcher(
        (action): action is any => action.type.endsWith("/pending"),
        (state, action) => {
          if (action.type.includes("sendMessage")) {
            state.sending = true;
          } else {
            state.loading = true;
          }
        }
      )
      .addMatcher(
        (action): action is any => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.sending = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const {
  clearError,
  resetChatMessages,
  receiveMessage,
  clearUnreadCount, // EXPORTED
} = adminChatSlice.actions;

export default adminChatSlice.reducer;