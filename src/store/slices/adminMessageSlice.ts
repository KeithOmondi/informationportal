import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// ==========================
// Types
// ==========================
export type MessageAudience = "JUDGES" | "DR" | "ALL";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "judge" | "dr";
  isActive: boolean;
}

export interface Message {
  _id: string;
  sender: User | string;
  receiver?: User | string;
  group?: string;
  text?: string;
  imageUrl?: string;
  senderType: "admin" | "judge" | "dr";
  readBy: string[];
  isBroadcast?: boolean;
  audience?: MessageAudience;
  isEdited?: boolean;
  isDeleted?: boolean;
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
  messages: Message[];
  chatMessages: Message[];
  unreadCount: number;
  groups: Group[];
  stats: Record<string, any>;
  loading: boolean;
  sending: boolean;
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
  { success: boolean; data: Message[] }, 
  { page?: number; limit?: number; isBroadcast?: boolean; receiverId?: string }
>("adminChat/fetchAllMessages", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/chat/messages", { params });
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch logs");
  }
});

export const fetchChatMessages = createAsyncThunk<
  { success: boolean; data: Message[] },
  { receiverId?: string; groupId?: string; isBroadcast?: boolean; page?: number; limit?: number }
>("adminChat/fetchChatMessages", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/chat/messages", { params });
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
    audience?: MessageAudience;
    targetRole?: "judge" | "dr";
    groupId?: string;
  }
>("adminChat/sendMessage", async (payload, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    if (payload.text) formData.append("text", payload.text);
    if (payload.image) formData.append("image", payload.image);

    if (payload.isBroadcast) {
      formData.append("isBroadcast", "true");
      formData.append("audience", payload.audience || "ALL");
    } else if (payload.groupId) {
      formData.append("group", payload.groupId);
    } else {
      if (payload.targetRole) formData.append("targetRole", payload.targetRole);
      if (payload.receivers && payload.receivers.length > 0) {
        payload.receivers.forEach(id => formData.append("receivers", id));
      } else if (payload.receiver) {
        formData.append("receiver", payload.receiver);
      } else {
        return rejectWithValue("Please select a recipient.");
      }
    }

    const { data } = await api.post("/chat/admin/send", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to send message");
  }
});

// RESTORED: Fetch Stats for AdminDashboard
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

// RESTORED: Group Management
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
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const msg = action.payload;
      if (!msg?._id) return;

      const inThread = state.chatMessages.some((m) => m._id === msg._id);
      if (!inThread) {
        state.chatMessages.push(msg);
        if (msg.senderType !== "admin") state.unreadCount += 1;
      }

      const inLogs = state.messages.some((m) => m._id === msg._id);
      if (!inLogs) state.messages.unshift(msg);
    },
    updateMessage: (state, action: PayloadAction<Partial<Message> & { _id: string }>) => {
      const index = state.chatMessages.findIndex(m => m._id === action.payload._id);
      if (index !== -1) {
        state.chatMessages[index] = { ...state.chatMessages[index], ...action.payload };
      }
      const logIndex = state.messages.findIndex(m => m._id === action.payload._id);
      if (logIndex !== -1) {
        state.messages[logIndex] = { ...state.messages[logIndex], ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.data;
        state.totalMessages = action.payload.data.length;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.chatMessages = action.payload.data;
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
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
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
        state.loading = false;
        state.chatMessages = state.chatMessages.filter(m => m._id !== action.payload);
        state.messages = state.messages.filter(m => m._id !== action.payload);
      })
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
  clearUnreadCount,
  updateMessage,
} = adminChatSlice.actions;

export default adminChatSlice.reducer;