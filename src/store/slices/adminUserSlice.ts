import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

/* =====================================
    Types
===================================== */
export interface IUser {
  _id: string;
  name: string;
  pj: string;
  email: string;
  // Added "dr" and "judge" to resolve TS comparison errors
  role: "admin" | "judge" | "dr" | "guest";
  cohort?: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  hasChatted?: boolean;
}

interface UserState {
  profile: IUser | null;
  users: IUser[];
  activeConversationIds: string[];
  loading: boolean;
  error: string | null;
}

/* =====================================
    Local Storage Helper
===================================== */
const getPersistedActiveIds = (): string[] => {
  try {
    const saved = localStorage.getItem("active_chat_ids");
    if (!saved || saved === "undefined") return [];
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
};

const initialState: UserState = {
  profile: null,
  users: [],
  activeConversationIds: getPersistedActiveIds(),
  loading: false,
  error: null,
};

/* =====================================
    Async Thunks
===================================== */

export const fetchProfile = createAsyncThunk(
  "users/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/users/me");
      return data.user;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch profile",
      );
    }
  },
);

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/users/get");
      return data.users;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Registry retrieval failed",
      );
    }
  },
);

export const createAdminUser = createAsyncThunk<
  IUser,
  {
    name: string;
    pj: string;
    email: string;
    password: string;
    role: string;
    cohort?: number;
  },
  { rejectValue: string }
>("users/createAdminUser", async (userData, thunkAPI) => {
  try {
    const { data } = await api.post("/users/create", userData);
    return data.user as IUser;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(
      err.response?.data?.message || "Failed to create user",
    );
  }
});

export const updateAdminUser = createAsyncThunk(
  "users/updateUser",
  async (
    { id, updates }: { id: string; updates: Partial<IUser> },
    thunkAPI,
  ) => {
    try {
      const { data } = await api.patch(`/users/${id}`, updates);
      return data.user;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Update failed",
      );
    }
  },
);

export const editAdminDetails = createAsyncThunk(
  "users/editDetails",
  async (
    { id, updates }: { id: string; updates: Partial<IUser> },
    thunkAPI,
  ) => {
    try {
      const { data } = await api.patch(`/users/edit/${id}`, updates);
      return data.user;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Details update failed",
      );
    }
  },
);

export const deleteAdminUser = createAsyncThunk(
  "users/deleteUser",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Deletion failed",
      );
    }
  },
);

export const fetchActiveConversations = createAsyncThunk(
  "users/fetchActiveConversations",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/chat/conversations/active");
      // Map the array to ensure we are getting IDs correctly
      return Array.isArray(data) ? data.map((c) => c._id || c) : [];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch conversations",
      );
    }
  },
);

/* =====================================
    Slice
===================================== */

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    resetUserSlice: (state) => {
      state.profile = null;
      state.users = [];
      state.error = null;
    },
    addToActiveConversations: (state, action: PayloadAction<string>) => {
      if (!state.activeConversationIds.includes(action.payload)) {
        state.activeConversationIds.push(action.payload);
        localStorage.setItem(
          "active_chat_ids",
          JSON.stringify(state.activeConversationIds),
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchProfile.fulfilled,
        (state, action: PayloadAction<IUser>) => {
          state.loading = false;
          state.profile = action.payload;
        },
      )
      .addCase(
        fetchUsers.fulfilled,
        (state, action: PayloadAction<IUser[]>) => {
          state.loading = false;
          state.users = action.payload;
        },
      )
      .addCase(
        createAdminUser.fulfilled,
        (state, action: PayloadAction<IUser>) => {
          state.loading = false;
          state.users.unshift(action.payload);
        },
      )
      .addCase(
        deleteAdminUser.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.users = state.users.filter((u) => u._id !== action.payload);
          state.activeConversationIds = state.activeConversationIds.filter(
            (id) => id !== action.payload,
          );
          localStorage.setItem(
            "active_chat_ids",
            JSON.stringify(state.activeConversationIds),
          );
        },
      )
      .addCase(
        fetchActiveConversations.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.activeConversationIds = action.payload;
          localStorage.setItem(
            "active_chat_ids",
            JSON.stringify(action.payload),
          );
        },
      )
      // Use Matchers for Pending/Rejected to keep it clean
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action): action is PayloadAction<string> =>
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          // Now TypeScript knows action.payload exists and is a string
          state.error = action.payload || "An unexpected error occurred";
        },
      )
      .addMatcher(
        (action) =>
          [
            updateAdminUser.fulfilled.type,
            editAdminDetails.fulfilled.type,
          ].includes(action.type),
        (state, action: PayloadAction<IUser>) => {
          const index = state.users.findIndex(
            (u) => u._id === action.payload._id,
          );
          if (index !== -1) {
            state.users[index] = action.payload;
          }
          if (state.profile?._id === action.payload._id) {
            state.profile = action.payload;
          }
          state.loading = false;
          state.error = null;
        },
      );
  },
});

export const { clearUserError, addToActiveConversations, resetUserSlice } =
  userSlice.actions;
export default userSlice.reducer;
