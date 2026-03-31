import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

/* =====================================================
    TYPES
===================================================== */

export type UserRole = "judge" | "dr" | "admin" | "all";

export interface Judge {
  _id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  targetAudience: UserRole[];
}

export interface Presentation {
  _id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  publicId: string;
  resourceType: string;
  uploadedAt: string;
  targetAudience: UserRole[];
}

interface CeremonyState {
  judges: Judge[];
  presentations: Presentation[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: CeremonyState = {
  judges: [],
  presentations: [],
  loading: false,
  error: null,
  success: false,
};

/* =====================================================
    ASYNC THUNKS
===================================================== */

export const fetchCeremonyInfo = createAsyncThunk<any, UserRole | undefined, { rejectValue: string }>(
  "ceremony/fetchAll",
  async (role, thunkAPI) => {
    try {
      const response = await api.get("/oath/court-info", {
        params: role ? { role } : {},
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch ceremony data"
      );
    }
  }
);

export const fetchAdminDashboard = createAsyncThunk<any, void, { rejectValue: string }>(
  "ceremony/fetchAdmin",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/oath/court-info/admin/dashboard");
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin data"
      );
    }
  }
);

export const addJudgeBio = createAsyncThunk<any, FormData, { rejectValue: string }>(
  "ceremony/addJudge",
  async (formData, thunkAPI) => {
    try {
      const response = await api.post("/oath/court-info/bios", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to add judge profile"
      );
    }
  }
);

export const updateJudgeBio = createAsyncThunk<any, { judgeId: string; formData: FormData }, { rejectValue: string }>(
  "ceremony/updateJudge",
  async ({ judgeId, formData }, thunkAPI) => {
    try {
      const response = await api.patch(`/oath/court-info/judge/${judgeId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update judge profile"
      );
    }
  }
);

export const addPresentation = createAsyncThunk<any, FormData, { rejectValue: string }>(
  "ceremony/addPresentation",
  async (formData, thunkAPI) => {
    try {
      const response = await api.post("/oath/court-info/presentations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to upload presentation"
      );
    }
  }
);

export const deleteCeremonyItem = createAsyncThunk<any, { type: "judges" | "presentations"; id: string }, { rejectValue: string }>(
  "ceremony/deleteItem",
  async ({ type, id }, thunkAPI) => {
    try {
      const response = await api.delete(`/oath/court-info/${type}/${id}`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete item"
      );
    }
  }
);

/* =====================================================
    SLICE
===================================================== */

const ceremonySlice = createSlice({
  name: "ceremony",
  initialState,
  reducers: {
    resetCeremonyStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch matchers (Public & Admin)
      .addMatcher(
        (action) =>
          action.type === fetchCeremonyInfo.fulfilled.type ||
          action.type === fetchAdminDashboard.fulfilled.type,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          const source = action.payload.data || action.payload;
          state.judges = source.judges || [];
          state.presentations = source.presentations || [];
        }
      )

      // Mutation matcher (Add, Update, Delete)
      .addMatcher(
        (action) =>
          [
            addJudgeBio.fulfilled.type,
            updateJudgeBio.fulfilled.type,
            addPresentation.fulfilled.type,
            deleteCeremonyItem.fulfilled.type,
          ].includes(action.type),
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          const data = action.payload.data || action.payload;
          if (data.judges) state.judges = data.judges;
          if (data.presentations) state.presentations = data.presentations;
        }
      )

      // Pending
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.success = false;
        }
      )

      // Rejected
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload || "An unexpected error occurred";
        }
      );
  },
});

export const { resetCeremonyStatus } = ceremonySlice.actions;
export default ceremonySlice.reducer;