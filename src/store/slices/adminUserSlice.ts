import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "../../api/axios";

/* =====================================
    Types
===================================== */
export interface IUser {
  _id: string;
  name: string;
  pj: string;
  email: string;
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

// Interface to handle the dynamic response from active conversations
interface IActiveConversationResponse {
  _id: string;
}

/* =====================================
    Local Storage Helper
===================================== */
/* =====================================
    Local Storage Helper
===================================== */
const getPersistedActiveIds = (): string[] => {
  try {
    const saved = localStorage.getItem("active_chat_ids");
    if (!saved || saved === "undefined") return [];
    return JSON.parse(saved);
  } catch { // Variable removed to satisfy no-unused-vars
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

export const fetchProfile = createAsyncThunk<IUser, void, { rejectValue: string }>(
  "users/fetchProfile",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get<{ user: IUser }>("/users/me");
      return data.user;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(
          err.response?.data?.message || "Failed to fetch profile",
        );
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  },
);

export const fetchUsers = createAsyncThunk<IUser[], void, { rejectValue: string }>(
  "users/fetchUsers",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get<{ users: IUser[] }>("/users/get");
      return data.users;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(
          err.response?.data?.message || "Registry retrieval failed",
        );
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
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
    const { data } = await api.post<{ user: IUser }>("/users/create", userData);
    return data.user;
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create user",
      );
    }
    return thunkAPI.rejectWithValue("An unknown error occurred");
  }
});

export const updateAdminUser = createAsyncThunk<
  IUser,
  { id: string; updates: Partial<IUser> },
  { rejectValue: string }
>(
  "users/updateUser",
  async ({ id, updates }, thunkAPI) => {
    try {
      const { data } = await api.patch<{ user: IUser }>(`/users/${id}`, updates);
      return data.user;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(
          err.response?.data?.message || "Update failed",
        );
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  },
);

export const editAdminDetails = createAsyncThunk<
  IUser,
  { id: string; updates: Partial<IUser> },
  { rejectValue: string }
>(
  "users/editDetails",
  async ({ id, updates }, thunkAPI) => {
    try {
      const { data } = await api.patch<{ user: IUser }>(`/users/edit/${id}`, updates);
      return data.user;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(
          err.response?.data?.message || "Details update failed",
        );
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  },
);

export const deleteAdminUser = createAsyncThunk<string, string, { rejectValue: string }>(
  "users/deleteUser",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(
          err.response?.data?.message || "Deletion failed",
        );
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  },
);

export const fetchActiveConversations = createAsyncThunk<string[], void, { rejectValue: string }>(
  "users/fetchActiveConversations",
  async (_, thunkAPI) => {
    try {
      // Handles data that could be a string array or object array
      const { data } = await api.get<(IActiveConversationResponse | string)[]>("/chat/conversations/active");
      
      return Array.isArray(data) 
        ? data.map((c) => (typeof c === "string" ? c : c._id)) 
        : [];
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(
          err.response?.data?.message || "Failed to fetch conversations",
        );
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
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
        (state, action) => {
          state.loading = false;
          state.profile = action.payload;
        },
      )
      .addCase(
        fetchUsers.fulfilled,
        (state, action) => {
          state.loading = false;
          state.users = action.payload;
        },
      )
      .addCase(
        createAdminUser.fulfilled,
        (state, action) => {
          state.loading = false;
          state.users.unshift(action.payload);
        },
      )
      .addCase(
        deleteAdminUser.fulfilled,
        (state, action) => {
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
        (state, action) => {
          state.activeConversationIds = action.payload;
          localStorage.setItem(
            "active_chat_ids",
            JSON.stringify(action.payload),
          );
        },
      )
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