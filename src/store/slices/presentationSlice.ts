import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

export type PresentationRole = "judge" | "dr" | "admin" | "all";

export interface Presentation {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  downloadUrl: string;
  publicId: string;
  fileType: "image" | "video" | "raw";
  mimeType: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  targetAudience: PresentationRole[];
  createdAt: string;
}

interface PresentationState {
  items: Presentation[];
  loading: boolean;
  uploading: boolean;
  deleting: string | null;
  success: boolean;
  error: string | null;
}

const initialState: PresentationState = {
  items: [],
  loading: false,
  uploading: false,
  deleting: null,
  success: false,
  error: null,
};

// --- Thunks ---

export const fetchPresentations = createAsyncThunk(
  "presentations/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/presentations");
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load presentations"
      );
    }
  }
);

export const fetchPresentationsForAdmin = createAsyncThunk(
  "presentations/fetchAdmin",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/presentations/admin");
      // Handle { success, count, data: [...] }
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load presentations"
      );
    }
  }
);

export const uploadPresentation = createAsyncThunk(
  "presentations/upload",
  async (formData: FormData, thunkAPI) => {
    try {
      const response = await api.post("/presentations/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Upload failed. File might be too large."
      );
    }
  }
);

// --- NEW: Bulk Update Thunk ---
export const updatePresentationsBulk = createAsyncThunk(
  "presentations/updateBulk",
  async ({ ids, targetAudience }: { ids: string[]; targetAudience: PresentationRole[] }, thunkAPI) => {
    try {
      await api.patch("/presentations/bulk-update", { ids, targetAudience });
      return { ids, targetAudience };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Bulk update failed"
      );
    }
  }
);

export const deletePresentation = createAsyncThunk(
  "presentations/delete",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/presentations/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Deletion failed"
      );
    }
  }
);

// --- Slice ---

const presentationSlice = createSlice({
  name: "presentations",
  initialState,
  reducers: {
    resetPresentationStatus: (state) => {
      state.success = false;
      state.error = null;
    },
    locallyIncrementDownload: (state, action: PayloadAction<string>) => {
      const item = state.items.find(p => p._id === action.payload);
      if (item) {
        item.downloadCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch (user)
      .addCase(fetchPresentations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresentations.fulfilled, (state, action: PayloadAction<Presentation[]>) => {
        state.loading = false;
        state.items = action.payload;
      })

      // Fetch (admin)
      .addCase(fetchPresentationsForAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresentationsForAdmin.fulfilled, (state, action: PayloadAction<{ data: Presentation[] }>) => {
        state.loading = false;
        state.items = action.payload.data;
      })

      // Upload
      .addCase(uploadPresentation.pending, (state) => {
        state.uploading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(uploadPresentation.fulfilled, (state, action: PayloadAction<Presentation>) => {
        state.uploading = false;
        state.success = true;
        state.items.unshift(action.payload);
      })

      // Delete
      .addCase(deletePresentation.pending, (state, action) => {
        state.deleting = action.meta.arg;
        state.error = null;
      })
      .addCase(deletePresentation.fulfilled, (state, action: PayloadAction<string>) => {
        state.deleting = null;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })

      // --- NEW: Bulk Update Handler ---
      .addCase(updatePresentationsBulk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePresentationsBulk.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, targetAudience } = action.payload;
        // Update local state for all matched items
        state.items = state.items.map((item) => 
          ids.includes(item._id) 
            ? { ...item, targetAudience } 
            : item
        );
      })

      // Global Rejected Matcher
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.uploading = false;
          state.deleting = null;
          state.error = action.payload as string;
          state.success = false;
        }
      );
  },
});

export const { resetPresentationStatus, locallyIncrementDownload } = presentationSlice.actions;
export default presentationSlice.reducer;