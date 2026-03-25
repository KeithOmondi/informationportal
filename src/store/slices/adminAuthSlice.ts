import {
  createSlice,
  createAsyncThunk,
  type ActionReducerMapBuilder,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";
import axios from "axios";

/* ===========================
    TYPES
=========================== */

export interface User {
  _id: string;
  pj: string;
  name: string;
  email: string;
  role: "admin" | "judge" | "guest";
  lastLogin?: string; 
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  isInitialized: false,
};

/* ===========================
    ASYNC THUNKS
=========================== */

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ pj }: { pj: string }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { pj }, { withCredentials: true });
      return res.data as AuthResponse;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Invalid credentials.");
    }
  }
);

export const refreshUser = createAsyncThunk(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      // Use standard axios for refresh to avoid interceptor loops
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      return res.data as AuthResponse;
    } catch (err: any) {
      // "NO_SESSION" is a silent error handled in the extraReducers
      return rejectWithValue(err.response?.data?.message || "NO_SESSION");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      return true;
    } catch (err: any) {
      // We still return true/success to the reducer to ensure local wipe
      return rejectWithValue("Server logout failed, local session cleared.");
    }
  }
);

/* ===========================
    SLICE
=========================== */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Force a local wipe (used for 401 interceptors)
    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.loading = false;
      state.isInitialized = true;
    },
  },

  extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
      /* ---------- LOGIN ---------- */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isInitialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })

      /* ---------- REFRESH ---------- */
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isInitialized = true;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isInitialized = true;
        // Only show error if it's a real failure, not just "no session found"
        const msg = action.payload as string;
        if (msg && msg !== "NO_SESSION") {
          state.error = msg;
        }
      })

      /* ---------- LOGOUT MATCHER (The Fix) ---------- */
      // This triggers on ANY logout action (fulfilled or rejected)
      .addMatcher(
        (action) => action.type.startsWith("auth/logoutUser"),
        (state) => {
          state.user = null;
          state.accessToken = null;
          state.loading = false;
          state.error = null;
          state.isInitialized = true;
        }
      );
  },
});

export const { clearError, clearUser } = authSlice.actions;
export default authSlice.reducer;