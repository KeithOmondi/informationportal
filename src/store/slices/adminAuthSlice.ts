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

export type UserRole = "admin" | "judge" | "dr"; // Updated to match Model

export interface User {
  _id: string;
  pj: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin?: string; 
}

interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  // Added for DR First-Time Login
  requiresPasswordChange?: boolean;
  userId?: string; 
  message?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  // UI States for the "Two-Lane" flow
  requiresPasswordChange: boolean;
  tempUserId: string | null; 
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  isInitialized: false,
  requiresPasswordChange: false,
  tempUserId: null,
};

/* ===========================
    ASYNC THUNKS
=========================== */

/**
 * Handles Hybrid Login (PJ or Email/Pass)
 */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { pj?: string; email?: string; password?: string }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", credentials, { withCredentials: true });
      
      // Handle the 202 status for DRs needing password setup
      if (res.status === 202) {
        return res.data as AuthResponse; 
      }
      
      return res.data as AuthResponse;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed.");
    }
  }
);

/**
 * Finalizes DR Setup (Password Reset Lane)
 */
export const setupPassword = createAsyncThunk(
  "auth/setupPassword",
  async (data: { userId: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const res = await api.patch("/auth/setup-password", data, { withCredentials: true });
      return res.data as AuthResponse;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to set password.");
    }
  }
);

export const refreshUser = createAsyncThunk(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      return res.data as AuthResponse;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "NO_SESSION");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (allDevices: boolean = false, { rejectWithValue }) => {
    try {
      const endpoint = allDevices ? "/auth/logout-all" : "/auth/logout";
      await api.post(endpoint, {}, { withCredentials: true });
      return true;
    } catch (err: any) {
      return rejectWithValue("Local session cleared.");
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
    resetAuthFlow: (state) => {
      state.requiresPasswordChange = false;
      state.tempUserId = null;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.accessToken = null;
      state.loading = false;
      state.isInitialized = true;
    },
  },

  extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
      /* ---------- LOGIN & SETUP ---------- */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        
        if (action.payload.requiresPasswordChange) {
          // DR Lane: Trigger the "Set Password" UI
          state.requiresPasswordChange = true;
          state.tempUserId = action.payload.userId || null;
        } else {
          // PJ or Verified DR Lane: Standard Login
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.requiresPasswordChange = false;
          state.tempUserId = null;
        }
        state.isInitialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })

      /* ---------- SETUP PASSWORD (DR Success) ---------- */
      .addCase(setupPassword.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.requiresPasswordChange = false;
        state.tempUserId = null;
      })

      /* ---------- REFRESH ---------- */
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
        const msg = action.payload as string;
        if (msg !== "NO_SESSION") state.error = msg;
      })

      /* ---------- LOGOUT ---------- */
      .addMatcher(
        (action) => action.type.startsWith("auth/logoutUser"),
        (state) => {
          Object.assign(state, initialState, { isInitialized: true });
        }
      );
  },
});

export const { clearError, clearUser, resetAuthFlow } = authSlice.actions;
export default authSlice.reducer;