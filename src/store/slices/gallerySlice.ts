import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
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

// Standard Backend Response Shape (adjust if your backend wraps differently)
interface GalleryResponse {
  success: boolean;
  data: IGallery[];
  message?: string;
}

// -------------------- THUNKS --------------------

export const fetchGallery = createAsyncThunk<IGallery[], void, { rejectValue: string }>(
  "gallery/fetchGallery",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<GalleryResponse>(`/gallery/get`);
      // Matches your data.data || data logic
      return res.data.data || (res.data as unknown as IGallery[]);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch gallery");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchGalleryAdmin = createAsyncThunk<IGallery[], void, { rejectValue: string }>(
  "gallery/fetchGalleryAdmin", 
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<GalleryResponse>(`/gallery/admin`);
      return res.data.data || (res.data as unknown as IGallery[]);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch admin gallery");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const uploadMedia = createAsyncThunk<IGallery[], FormData, { rejectValue: string }>(
  "gallery/uploadMedia",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post<GalleryResponse>(`/gallery/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data; 
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to upload media");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const updateAudienceBulk = createAsyncThunk<
  { ids: string[]; targetAudience: AudienceRole },
  { ids: string[]; targetAudience: AudienceRole },
  { rejectValue: string }
>(
  "gallery/updateAudienceBulk",
  async ({ ids, targetAudience }, { rejectWithValue }) => {
    try {
      await api.patch(`/gallery/bulk-audience`, { ids, targetAudience });
      return { ids, targetAudience };
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to update audience");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

export const deleteMedia = createAsyncThunk<string, string, { rejectValue: string }>(
  "gallery/deleteMedia",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/gallery/${id}`);
      return id;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue(err.response?.data?.message || "Failed to delete media");
      }
      return rejectWithValue("An unknown error occurred");
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
      .addCase(uploadMedia.fulfilled, (state, action) => { 
        state.loading = false; 
        state.items = [...action.payload, ...state.items]; 
      })

      // DELETE
      .addCase(deleteMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })

      // BULK UPDATE
      .addCase(updateAudienceBulk.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, targetAudience } = action.payload;
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
          updateAudienceBulk.pending.type
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
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload ?? "An unexpected error occurred";
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