import { createSlice, createAsyncThunk, type PayloadAction, type AnyAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// --- Interfaces (Moved into Slice) ---

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
  isLocked?: boolean;
  scheduledRelease?: string;
  updatedAt?: string;
}

interface ProgramState {
  program: ProgramData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProgramState = {
  program: null,
  loading: false,
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
  async ({ id, data }: { id: string; data: Partial<ProgramData> }, thunkAPI) => {
    try {
      const response = await api.patch(`/program/admin/update/${id}`, data);
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
    },
  },
  extraReducers: (builder) => {
    builder
      // 1. Cases (Specific Thunk Actions)
      .addCase(fetchProgram.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.program = action.payload;
      })
      .addCase(fetchProgramForAdmin.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.program = action.payload;
      })
      .addCase(createProgram.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.program = action.payload;
      })
      .addCase(updateProgram.fulfilled, (state, action: PayloadAction<ProgramData>) => {
        state.loading = false;
        state.program = action.payload;
      })
      .addCase(deleteProgram.fulfilled, (state) => {
        state.loading = false;
        state.program = null;
      })

      // 2. Matchers (Global Lifecycle Handlers)
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith("/pending"),
        (state: ProgramState) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action): action is AnyAction => action.type.endsWith("/rejected"),
        (state: ProgramState, action: AnyAction) => {
          state.loading = false;
          state.error = (action.payload as string) || "An unexpected error occurred";
        }
      );
  },
});

export const { clearProgramError } = programSlice.actions;
export default programSlice.reducer;