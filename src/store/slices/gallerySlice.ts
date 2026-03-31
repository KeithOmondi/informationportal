import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// -------------------- TYPES --------------------

export type AudienceRole = "judge" | "dr" | "all";

export interface IGallery {
  _id: string;
  description: string;
  url: string;
  downloadUrl: string;
  resourceType: "image" | "video";
  targetAudience: AudienceRole;
  downloadCount: number;
  uploadedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface GalleryState {
  items: IGallery[];
  loading: boolean;
  error: string | null;
}

const initialState: GalleryState = {
  items: [],
  loading: false,
  error: null,
};

// -------------------- THUNKS --------------------

export const fetchGallery = createAsyncThunk(
  "gallery/fetchGallery",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/gallery/get`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch gallery");
    }
  }
);

export const fetchGalleryAdmin = createAsyncThunk(
  "gallery/fetchGalleryAdmin", 
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/gallery/admin`);
      return res.data.data || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch admin gallery");
    }
  }
);

export const uploadMedia = createAsyncThunk(
  "gallery/uploadMedia",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await api.post(`/gallery/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data; 
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to upload media");
    }
  }
);

// --- NEW: Bulk Update Thunk ---
export const updateAudienceBulk = createAsyncThunk(
  "gallery/updateAudienceBulk",
  async ({ ids, targetAudience }: { ids: string[]; targetAudience: AudienceRole }, { rejectWithValue }) => {
    try {
      await api.patch(`/gallery/bulk-audience`, { ids, targetAudience });
      return { ids, targetAudience };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update audience");
    }
  }
);

export const deleteMedia = createAsyncThunk(
  "gallery/deleteMedia",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/gallery/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete media");
    }
  }
);

// -------------------- SLICE --------------------

const gallerySlice = createSlice({
  name: "gallery",
  initialState,
  reducers: {
    clearGalleryError(state) {
      state.error = null;
    },
    resetGallery(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    locallyIncrementGalleryDownload(state, action: PayloadAction<string>) {
      const item = state.items.find((m) => m._id === action.payload);
      if (item) {
        item.downloadCount = (item.downloadCount || 0) + 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // UPLOAD
      .addCase(uploadMedia.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(uploadMedia.fulfilled, (state, action: PayloadAction<IGallery[]>) => { 
        state.loading = false; 
        state.items = [...action.payload, ...state.items]; 
      })

      // DELETE
      .addCase(deleteMedia.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })

      // --- NEW: Handle Bulk Update Success ---
      .addCase(updateAudienceBulk.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, targetAudience } = action.payload;
        // Efficiently update only the changed items in the state
        state.items = state.items.map((item) => 
          ids.includes(item._id) 
            ? { ...item, targetAudience } 
            : item
        );
      })

      // FETCH MATCHERS
      .addMatcher(
        (action) => [
          fetchGallery.pending.type, 
          fetchGalleryAdmin.pending.type,
          deleteMedia.pending.type,
          updateAudienceBulk.pending.type // Added pending state for update
        ].includes(action.type),
        (state) => { 
          state.loading = true; 
          state.error = null; 
        }
      )
      .addMatcher(
        (action) => [fetchGallery.fulfilled.type, fetchGalleryAdmin.fulfilled.type].includes(action.type),
        (state, action: PayloadAction<IGallery[]>) => { 
          state.loading = false; 
          state.items = action.payload; 
        }
      )
      // GLOBAL REJECTED HANDLER
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { 
  clearGalleryError, 
  resetGallery, 
  locallyIncrementGalleryDownload 
} = gallerySlice.actions;

export default gallerySlice.reducer;