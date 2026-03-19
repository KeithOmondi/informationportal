import {
  createSlice,
  createAsyncThunk,
  type ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

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
export const loginUser = createAsyncThunk<
  User,
  { pj: string },
  { rejectValue: { message: string } }
>("auth/loginUser", async ({ pj }, { rejectWithValue }) => {
  try {
    const res = await api.post("/auth/login", { pj }, { withCredentials: true });
    return res.data.user;
  } catch (err: any) {
    const message = err.response?.data?.message || "Invalid credentials.";
    return rejectWithValue({ message });
  }
});

/* ---------- SESSION REFRESH ---------- */
export const refreshUser = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/refresh", {}, { withCredentials: true });
      return res.data.user;
    } catch (err: any) {
      // Check if this was a security-based rejection
      const message = err.response?.data?.message || "NO_SESSION";
      return rejectWithValue(message);
    }
  }
);

/* ---------- LOGOUT ---------- */
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
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
    // Used by the interceptor to force a clean state
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.isInitialized = true;
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
        state.isInitialized = true; // Prevents AppContent from re-fetching
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
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
        
        // Handle "Kicked by another device" message specifically
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