import {
  createSlice,
  createAsyncThunk,
  type ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";
import axios, { AxiosError } from "axios";

/* ===========================
    TYPES
=========================== */

export type UserRole = "admin" | "judge" | "dr";

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
  requiresPasswordChange: boolean;
  tempUserId: string | null;
  resetEmailSent: boolean;
  passwordResetSuccess: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  isInitialized: false,
  requiresPasswordChange: false,
  tempUserId: null,
  resetEmailSent: false,
  passwordResetSuccess: false,
};

/* ===========================
    ASYNC THUNKS
=========================== */

export const loginUser = createAsyncThunk<AuthResponse, { pj?: string; email?: string; password?: string }, { rejectValue: string }>(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", credentials, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Login failed.");
      }
      return rejectWithValue("An unknown error occurred.");
    }
  }
);

export const requestPasswordReset = createAsyncThunk<{ message: string }, string, { rejectValue: string }>(
  "auth/requestPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      return res.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to send reset link.");
      }
      return rejectWithValue("An unknown error occurred.");
    }
  }
);

export const finalizePasswordReset = createAsyncThunk<{ message: string }, { token: string; password: string }, { rejectValue: string }>(
  "auth/finalizePasswordReset",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/auth/reset-password/${token}`, {
        password,
      });
      return res.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Reset link invalid or expired.");
      }
      return rejectWithValue("An unknown error occurred.");
    }
  }
);

export const setupPassword = createAsyncThunk<AuthResponse, { userId: string; newPassword: string }, { rejectValue: string }>(
  "auth/setupPassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.patch("/auth/setup-password", data, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to set password.");
      }
      return rejectWithValue("An unknown error occurred.");
    }
  }
);

export const refreshUser = createAsyncThunk<AuthResponse, void, { rejectValue: string }>(
  "auth/refreshUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "NO_SESSION");
      }
      return rejectWithValue("An unknown error occurred.");
    }
  }
);

export const logoutUser = createAsyncThunk<boolean, boolean | undefined, { rejectValue: string }>(
  "auth/logoutUser",
  async (allDevices = false, { rejectWithValue }) => {
    try {
      const endpoint = allDevices ? "/auth/logout-all" : "/auth/logout";
      await api.post(endpoint, {}, { withCredentials: true });
      return true;
    } catch {
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
      state.resetEmailSent = false;
      state.passwordResetSuccess = false;
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
      /* ---------- LOGIN ---------- */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requiresPasswordChange) {
          state.requiresPasswordChange = true;
          state.tempUserId = action.payload.userId || null;
        } else {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        }
        state.isInitialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed.";
        state.isInitialized = true;
      })

      /* ---------- FORGOT PASSWORD ---------- */
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.resetEmailSent = true;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to send reset link.";
      })

      /* ---------- RESET PASSWORD ---------- */
      .addCase(finalizePasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(finalizePasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.passwordResetSuccess = true;
      })
      .addCase(finalizePasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Reset link invalid or expired.";
      })

      /* ---------- SETUP PASSWORD ---------- */
      .addCase(setupPassword.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.requiresPasswordChange = false;
        state.tempUserId = null;
      })

      /* ---------- REFRESH ---------- */
      .addCase(refreshUser.pending, (state) => {
        state.loading = true;
        state.isInitialized = false;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
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
        const msg = action.payload;
        if (msg !== "NO_SESSION") state.error = msg ?? null;
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