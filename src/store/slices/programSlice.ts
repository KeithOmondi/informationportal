import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  type AnyAction,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// --- Types ---

export type AudienceRole = "judge" | "dr" | "all";

// --- Interfaces ---

export interface Activity {
  _id?: string;
  time: string;
  activity: string;
  facilitator?: string;
  session_chair?: string;
}

export interface DaySchedule {
  _id?: string;
  day: string;
  date: string | Date;
  session_chairs?: string[];
  activities: Activity[];
}

export interface ProgramData {
  _id: string;
  event_title: string;
  theme?: string;
  schedule: DaySchedule[];
  programFileUrl?: string;
  isLocked: boolean;
  scheduledRelease: string;
  targetAudience: AudienceRole;   // <-- NEW
  updatedAt?: string;
}

// Admin grouped-view shape from GET /admin/all
export interface GroupedPrograms {
  total: number;
  grouped: Record<AudienceRole, ProgramData[]>;
}

interface ProgramState {
  program: ProgramData | null;
  allPrograms: GroupedPrograms | null;  // <-- NEW: for admin overview
  loading: boolean;
  isInitialLoading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: ProgramState = {
  program: null,
  allPrograms: null,
  loading: false,
  isInitialLoading: true,
  success: false,
  error: null,
};

// --- Thunks ---

/**
 * Public fetch — passes the caller's role so the backend filters accordingly.
 * Role comes from the JWT (req.user.role) on the server, but we also send it
 * as a query param as a fallback for clients that need explicit control.
 */
export const fetchProgram = createAsyncThunk(
  "program/fetch",
  async (role: AudienceRole = "all", thunkAPI) => {
    try {
      const response = await api.get("/program", {
        params: { role },
      });
      return response.data as ProgramData;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load program"
      );
    }
  }
);

/**
 * Admin single-view — optionally filter by a specific audience.
 * Maps to GET /api/program/admin/view?audience=judge|dr|all
 */
export const fetchProgramForAdmin = createAsyncThunk(
  "program/fetchAdmin",
  async (audience?: AudienceRole, thunkAPI?) => {
    try {
      const response = await api.get("/program/admin/view", {
        params: audience ? { audience } : {},
      });
      return response.data as ProgramData;
    } catch (error: any) {
      return thunkAPI!.rejectWithValue(
        error.response?.data?.message || "Failed to load admin view"
      );
    }
  }
);

/**
 * Admin all-programs view grouped by targetAudience.
 * Maps to GET /api/program/admin/all
 */
export const fetchAllProgramsForAdmin = createAsyncThunk(
  "program/fetchAllAdmin",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/program/admin/all");
      return response.data as GroupedPrograms;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load all programs"
      );
    }
  }
);

/**
 * Create — payload must include targetAudience.
 */
export const createProgram = createAsyncThunk(
  "program/create",
  async (data: Partial<ProgramData> & { targetAudience: AudienceRole }, thunkAPI) => {
    try {
      const response = await api.post("/program/admin/create", data);
      return response.data as ProgramData;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Creation failed"
      );
    }
  }
);

/**
 * Update — targetAudience can be changed alongside other fields.
 */
export const updateProgram = createAsyncThunk(
  "program/update",
  async (
    { id, data }: { id: string; data: FormData | Partial<ProgramData> },
    thunkAPI
  ) => {
    try {
      const response = await api.patch(`/program/admin/update/${id}`, data, {
        headers:
          data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return response.data as ProgramData;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

export const deleteProgram = createAsyncThunk(
  "program/delete",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/program/admin/delete/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Delete failed"
      );
    }
  }
);

// --- Slice ---

const programSlice = createSlice({
  name: "program",
  initialState,
  reducers: {
    clearProgramError: (state) => {
      state.error = null;
      state.success = false;
    },
    resetProgramStatus: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fulfilled ---
      .addCase(
        fetchProgram.fulfilled,
        (state, action: PayloadAction<ProgramData>) => {
          state.loading = false;
          state.isInitialLoading = false;
          state.program = action.payload;
        }
      )
      .addCase(
        fetchProgramForAdmin.fulfilled,
        (state, action: PayloadAction<ProgramData>) => {
          state.loading = false;
          state.isInitialLoading = false;
          state.program = action.payload;
        }
      )
      .addCase(
        fetchAllProgramsForAdmin.fulfilled,
        (state, action: PayloadAction<GroupedPrograms>) => {
          state.loading = false;
          state.isInitialLoading = false;
          state.allPrograms = action.payload;  // stored separately from single program
        }
      )
      .addCase(
        createProgram.fulfilled,
        (state, action: PayloadAction<ProgramData>) => {
          state.loading = false;
          state.success = true;
          state.program = action.payload;
          // Invalidate grouped cache so admin/all refetches fresh data
          state.allPrograms = null;
        }
      )
      .addCase(
        updateProgram.fulfilled,
        (state, action: PayloadAction<ProgramData>) => {
          state.loading = false;
          state.success = true;
          state.program = action.payload;
          // If targetAudience changed, grouped cache is stale
          state.allPrograms = null;
        }
      )
      .addCase(deleteProgram.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.program = null;
        state.allPrograms = null;
      })

      // --- Pending (all thunks) ---
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.success = false;
        }
      )
      // --- Rejected (all thunks) ---
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith("/rejected"),
        (state, action: AnyAction) => {
          state.loading = false;
          state.isInitialLoading = false;
          state.success = false;
          state.error =
            (action.payload as string) || "An unexpected error occurred";
        }
      );
  },
});

export const { clearProgramError, resetProgramStatus } = programSlice.actions;
export default programSlice.reducer;