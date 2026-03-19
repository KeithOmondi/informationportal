import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

/* =====================================================
    TYPES
===================================================== */

export interface Judge {
  _id: string;
  name: string;
  title: string;
  description: string; // Aligned with Mongoose Schema
  imageUrl: string;
  imagePublicId: string;
  resourceType?: string;
}

export interface Presentation {
  _id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  publicId: string;
  resourceType: string;
  uploadedAt: string;
}

export interface ProgramItem {
  _id?: string;
  time?: string;
  event?: string;
  location?: string;
  iconType?: string;
}

export interface ProgramData {
  items: ProgramItem[];
  scheduledRelease: string | null;
  programFileUrl?: string | null;
  programFilePublicId?: string;
  programFileResourceType?: string;
  isLocked?: boolean; // Returned by getCourtInfo logic
}

interface CeremonyState {
  judges: Judge[];
  presentations: Presentation[];
  program: ProgramData;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: CeremonyState = {
  judges: [],
  presentations: [],
  program: {
    items: [],
    scheduledRelease: null,
    programFileUrl: null,
    isLocked: false,
  },
  loading: false,
  error: null,
  success: false,
};

/* =====================================================
    ASYNC THUNKS
===================================================== */

// Fetch all info (respects admin/release time logic)
export const fetchCeremonyInfo = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("ceremony/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get(`/oath/court-info/`);
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch ceremony data",
    );
  }
});

// Update Program (Items, Schedule, and File)
export const updateProgram = createAsyncThunk<
  any,
  FormData,
  { rejectValue: string }
>("ceremony/updateProgram", async (formData, thunkAPI) => {
  try {
    const response = await api.put(`/oath/court-info/program`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // Returns { message, program }
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to update program",
    );
  }
});

export const addJudgeBio = createAsyncThunk<
  any,
  FormData,
  { rejectValue: string }
>("ceremony/addJudge", async (formData, thunkAPI) => {
  try {
    const response = await api.post(`/oath/court-info/bios`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to add judge profile",
    );
  }
});

export const updateJudgeBio = createAsyncThunk<
  any,
  { judgeId: string; formData: FormData },
  { rejectValue: string }
>("ceremony/updateJudge", async ({ judgeId, formData }, thunkAPI) => {
  try {
    const response = await api.patch(`/oath/court-info/bios/${judgeId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to update judge profile",
    );
  }
});

export const addPresentation = createAsyncThunk<
  any,
  FormData,
  { rejectValue: string }
>("ceremony/addPresentation", async (formData, thunkAPI) => {
  try {
    const response = await api.post(`/oath/court-info/presentations`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to upload presentation",
    );
  }
});

export const deleteCeremonyItem = createAsyncThunk<
  any,
  { type: "judges" | "presentations"; id: string },
  { rejectValue: string }
>("ceremony/deleteItem", async ({ type, id }, thunkAPI) => {
  try {
    const response = await api.delete(`/oath/court-info/${type}/${id}`);
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to delete item",
    );
  }
});

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
      // Fetch Logic
      .addCase(fetchCeremonyInfo.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCeremonyInfo.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.judges = action.payload.judges || [];
        state.presentations = action.payload.presentations || [];
        state.program = action.payload.program || initialState.program;
      })

      // Universal Success Matcher (Updates program, judges, or presentations)
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled") && action.type !== "ceremony/fetchAll/fulfilled",
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          
          const payload = action.payload;
          
          // If the backend returns the full document (like in delete/add judge)
          const data = payload.data || payload;
          
          if (data.judges) state.judges = data.judges;
          if (data.presentations) state.presentations = data.presentations;
          
          // Specific check for the updateProgram response { message, program }
          if (data.program) {
            state.program = {
                ...state.program,
                ...data.program
            };
          }
        }
      )
      // Universal Pending/Error Matchers
      .addMatcher(
        (action) => action.type.endsWith("/pending") && action.type !== "ceremony/fetchAll/pending",
        (state) => {
          state.loading = true;
          state.error = null;
          state.success = false;
        }
      )
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