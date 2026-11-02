import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "../../api/axios";

// --- Types ---

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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
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

export const fetchPresentations = createAsyncThunk<Presentation[], void, { rejectValue: string }>(
  "presentations/fetchAll",
  async (_, thunkAPI) => {
    try {
      // User endpoint usually returns the array directly or wrapped
      const response = await api.get<Presentation[]>("/presentations");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load presentations");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const fetchPresentationsForAdmin = createAsyncThunk<ApiResponse<Presentation[]>, void, { rejectValue: string }>(
  "presentations/fetchAdmin",
  async (_, thunkAPI) => {
    try {
      const response = await api.get<ApiResponse<Presentation[]>>("/presentations/admin");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load presentations");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const uploadPresentation = createAsyncThunk<Presentation, FormData, { rejectValue: string }>(
  "presentations/upload",
  async (formData, thunkAPI) => {
    try {
      const response = await api.post<Presentation>("/presentations/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Upload failed. File might be too large.");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const updatePresentationsBulk = createAsyncThunk<
  { ids: string[]; targetAudience: PresentationRole[] },
  { ids: string[]; targetAudience: PresentationRole[] },
  { rejectValue: string }
>(
  "presentations/updateBulk",
  async ({ ids, targetAudience }, thunkAPI) => {
    try {
      await api.patch("/presentations/bulk-update", { ids, targetAudience });
      return { ids, targetAudience };
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Bulk update failed");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

export const deletePresentation = createAsyncThunk<string, string, { rejectValue: string }>(
  "presentations/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/presentations/${id}`);
      return id;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Deletion failed");
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
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
      .addCase(fetchPresentations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      // Fetch (admin)
      .addCase(fetchPresentationsForAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresentationsForAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
      })

      // Upload
      .addCase(uploadPresentation.pending, (state) => {
        state.uploading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(uploadPresentation.fulfilled, (state, action) => {
        state.uploading = false;
        state.success = true;
        state.items.unshift(action.payload);
      })

      // Delete
      .addCase(deletePresentation.pending, (state, action) => {
        state.deleting = action.meta.arg;
        state.error = null;
      })
      .addCase(deletePresentation.fulfilled, (state, action) => {
        state.deleting = null;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })

      // Bulk Update
      .addCase(updatePresentationsBulk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePresentationsBulk.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, targetAudience } = action.payload;
        state.items = state.items.map((item) => 
          ids.includes(item._id) 
            ? { ...item, targetAudience } 
            : item
        );
      })

      // Global Rejected Matcher
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.uploading = false;
          state.deleting = null;
          state.error = action.payload ?? "An unexpected error occurred";
          state.success = false;
        }
      );
  },
});

export const { resetPresentationStatus, locallyIncrementDownload } = presentationSlice.actions;
export default presentationSlice.reducer;