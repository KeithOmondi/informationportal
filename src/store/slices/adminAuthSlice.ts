import {
  createSlice,
  createAsyncThunk,
  type ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";
import axios from "axios"; // 👈 added

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

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isInitialized: false,
};

/* ===========================
    ASYNC THUNKS
=========================== */

/* ---------- LOGIN ---------- */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ pj }: { pj: string }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { pj }, { withCredentials: true });
      return res.data.user as User;
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid credentials.";
      return rejectWithValue({ message });
    }
  }
);

/* ---------- SESSION REFRESH ---------- */
export const refreshUser = createAsyncThunk(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      // 👇 plain axios bypasses interceptor — avoids infinite loop on Safari
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      return res.data.user as User;
    } catch (err: any) {
      const message = err.response?.data?.message || "NO_SESSION";
      return rejectWithValue(message);
    }
  }
);

/* ---------- LOGOUT ---------- */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (err: any) {
      return rejectWithValue("Logout failed.");
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
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.isInitialized = true; // 👈 fixed: was "isInitialized: true" (typo)
    },
    resetAuthFlags: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
      /* ---------- LOGIN ---------- */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || "Login failed";
        state.isInitialized = true;
      })

      /* ---------- REFRESH ---------- */
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isInitialized = true;
        const msg = action.payload as string;
        if (msg && msg !== "NO_SESSION") {
          state.error = msg;
        }
      })

      /* ---------- LOGOUT ---------- */
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.error = null;
        state.isInitialized = true;
      });
  },
});

export const { clearError, clearUser, resetAuthFlags } = authSlice.actions;
export default authSlice.reducer;