import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

export interface Presentation {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: "image" | "video" | "raw";
  mimeType: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

interface PresentationState {
  items: Presentation[];
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: PresentationState = {
  items: [],
  loading: false,
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
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to load materials");
    }
  }
);

export const uploadPresentation = createAsyncThunk(
  "presentations/upload",
  async (formData: FormData, thunkAPI) => {
    try {
      const response = await api.post("/presentations/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Upload failed");
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
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Deletion failed");
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPresentations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPresentations.fulfilled, (state, action: PayloadAction<Presentation[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      // Upload
      .addCase(uploadPresentation.pending, (state) => {
        state.loading = true;
        state.success = false;
      })
      .addCase(uploadPresentation.fulfilled, (state, action: PayloadAction<Presentation>) => {
        state.loading = false;
        state.success = true;
        state.items.unshift(action.payload); // Add new item to the top
      })
      // Delete
      .addCase(deletePresentation.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      // Generic Error Handler
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { resetPresentationStatus } = presentationSlice.actions;
export default presentationSlice.reducer;