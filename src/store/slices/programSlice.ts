import { createSlice, createAsyncThunk, type PayloadAction, type AnyAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// --- Interfaces ---

export interface Activity {
  _id?: string;
  time: string;
  activity: string;
  facilitator?: string;
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
  schedule: DaySchedule[];
  programFileUrl?: string;
  isLocked: boolean;
  scheduledRelease: string;
  updatedAt?: string;
}

interface ProgramState {
  program: ProgramData | null;
  loading: boolean;
  isInitialLoading: boolean; 
  success: boolean;
  error: string | null;
}

const initialState: ProgramState = {
  program: null,
  loading: false,
  isInitialLoading: true, 
  success: false,
  error: null,
};

// --- Thunks ---

export const fetchProgram = createAsyncThunk("program/fetch", async (_, thunkAPI) => {
  try {
    const response = await api.get("/program");
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load program");
  }
});

export const fetchProgramForAdmin = createAsyncThunk("program/fetchAdmin", async (_, thunkAPI) => {
  try {
    const response = await api.get("/program/admin/view");
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load admin view");
  }
});

export const createProgram = createAsyncThunk("program/create", async (data: Partial<ProgramData>, thunkAPI) => {
  try {
    const response = await api.post("/program/admin/create", data);
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Creation failed");
  }
});

export const updateProgram = createAsyncThunk(
  "program/update",
  async ({ id, data }: { id: string; data: FormData | Partial<ProgramData> }, thunkAPI) => {
    try {
      const response = await api.patch(`/program/admin/update/${id}`, data, {
        headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Update failed");
    }
  }
);

export const deleteProgram = createAsyncThunk("program/delete", async (id: string, thunkAPI) => {
  try {
    await api.delete(`/program/admin/delete/${id}`);
    return id;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Delete failed");
  }
});

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
    }
  },
  extraReducers: (builder) => {
    builder
      // Success Handlers
      .addCase(fetchProgram.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.isInitialLoading = false;
        state.program = action.payload;
      })
      .addCase(fetchProgramForAdmin.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.isInitialLoading = false;
        state.program = action.payload;
      })
      .addCase(createProgram.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.success = true;
        state.program = action.payload;
      })
      .addCase(updateProgram.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.success = true;
        state.program = action.payload;
      })
      .addCase(deleteProgram.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.program = null;
      })

      // Pending Matcher - Cleaned to prevent flickering
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
          state.success = false;
          // Note: We no longer nullify state.program here. 
          // This allows the UI to show existing data while the new data loads.
        }
      )
      // Rejected Matcher
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith("/rejected"),
        (state, action: AnyAction) => {
          state.loading = false;
          state.isInitialLoading = false; 
          state.success = false;
          state.error = (action.payload as string) || "An unexpected error occurred";
        }
      );
  },
});

export const { clearProgramError, resetProgramStatus } = programSlice.actions;
export default programSlice.reducer;