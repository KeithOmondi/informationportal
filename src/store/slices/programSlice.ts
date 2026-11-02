import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
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
  targetAudience: AudienceRole;
  updatedAt?: string;
}

export interface GroupedPrograms {
  total: number;
  grouped: Record<AudienceRole, ProgramData[]>;
}

interface ProgramState {
  program: ProgramData | null;
  allPrograms: GroupedPrograms | null;
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

export const fetchProgram = createAsyncThunk<ProgramData, AudienceRole | undefined, { rejectValue: string }>(
  "program/fetch",
  async (role = "all", thunkAPI) => {
    try {
      const response = await api.get("/program", {
        params: { role },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load program");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const fetchProgramForAdmin = createAsyncThunk<ProgramData, AudienceRole | undefined, { rejectValue: string }>(
  "program/fetchAdmin",
  async (audience, thunkAPI) => {
    try {
      const response = await api.get("/program/admin/view", {
        params: audience ? { audience } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load admin view");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const fetchAllProgramsForAdmin = createAsyncThunk<GroupedPrograms, void, { rejectValue: string }>(
  "program/fetchAllAdmin",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/program/admin/all");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load all programs");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const createProgram = createAsyncThunk<ProgramData, Partial<ProgramData> & { targetAudience: AudienceRole }, { rejectValue: string }>(
  "program/create",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/program/admin/create", data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Creation failed");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updateProgram = createAsyncThunk<ProgramData, { id: string; data: FormData | Partial<ProgramData> }, { rejectValue: string }>(
  "program/update",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await api.patch(`/program/admin/update/${id}`, data, {
        headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Update failed");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deleteProgram = createAsyncThunk<string, string, { rejectValue: string }>(
  "program/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/program/admin/delete/${id}`);
      return id;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Delete failed");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
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
      .addCase(fetchProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialLoading = false;
        state.program = action.payload;
      })
      .addCase(fetchProgramForAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialLoading = false;
        state.program = action.payload;
      })
      .addCase(fetchAllProgramsForAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialLoading = false;
        state.allPrograms = action.payload;
      })
      .addCase(createProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.program = action.payload;
        state.allPrograms = null;
      })
      .addCase(updateProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.program = action.payload;
        state.allPrograms = null;
      })
      .addCase(deleteProgram.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.program = null;
        state.allPrograms = null;
      })
      // --- Matchers ---
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.success = false;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.isInitialLoading = false;
          state.success = false;
          state.error = action.payload || "An unexpected error occurred";
        }
      );
  },
});

export const { clearProgramError, resetProgramStatus } = programSlice.actions;
export default programSlice.reducer;