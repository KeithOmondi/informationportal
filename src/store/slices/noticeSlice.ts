import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

/* ================= TYPES ================= */
export type NoticePriority = "NORMAL" | "URGENT";
export type TargetAudience = "ALL" | "JUDGES" | "REGISTRY" | "GUESTS";

export interface IAttachment {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
}

export interface IEventDetails {
  startDate: string;
  endDate?: string;
  venue: string;
  organizer: string;
  agenda?: string[];
}

export interface INotice {
  _id: string;
  title: string;
  description: string;
  slug: string;
  priority: NoticePriority;
  targetAudience: TargetAudience;
  eventDetails?: IEventDetails;
  attachments: IAttachment[];
  publishDate: string;
  expiryDate?: string;
  isActive: boolean;
  stats: {
    views: number;
    downloads: number;
  };
  readBy?: string[];
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NoticeState {
  notices: INotice[];
  publicNotices: INotice[];
  notice?: INotice;
  loading: boolean;
  uploading: boolean; 
  error?: string;
}

const initialState: NoticeState = {
  notices: [],
  publicNotices: [],
  loading: false,
  uploading: false,
};

/* ================= THUNKS ================= */

export const fetchPublicNotices = createAsyncThunk(
  "notices/fetchPublic",
  async (params: { priority?: string; search?: string; audience?: string } | undefined, thunkAPI) => {
    try {
      const { data } = await api.get(`/notices/public`, { params });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch public notices");
    }
  }
);

export const fetchNotices = createAsyncThunk(
  "notices/fetchAll",
  async (params: { priority?: string; search?: string; audience?: string } | undefined, thunkAPI) => {
    try {
      const { data } = await api.get(`/notices`, {
        params,
        withCredentials: true,
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch notices");
    }
  }
);

export const createNotice = createAsyncThunk(
  "notices/create",
  async (formData: FormData, thunkAPI) => {
    try {
      const { data } = await api.post(`/notices/create`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data; // Now returns the populated notice from backend
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Upload failed");
    }
  }
);

export const downloadNotice = createAsyncThunk(
  "notices/download",
  async (id: string, thunkAPI) => {
    try {
      const { data } = await api.get(`/notices/download/${id}`, { withCredentials: true });
      if (data.url) window.open(data.url, "_blank");
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Download failed");
    }
  }
);

export const fetchNoticeById = createAsyncThunk(
  "notices/fetchOne",
  async (id: string, thunkAPI) => {
    try {
      const { data } = await api.get(`/notices/${id}`, { withCredentials: true });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Fetch failed");
    }
  }
);

export const updateNotice = createAsyncThunk(
  "notices/update",
  async ({ id, formData }: { id: string; formData: FormData }, thunkAPI) => {
    try {
      const { data } = await api.put(`/notices/update/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

export const deleteNotice = createAsyncThunk(
  "notices/delete",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/notices/delete/${id}`, { withCredentials: true });
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);

/* ================= SLICE ================= */

const noticeSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    clearNoticeError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      /* FETCH ALL/PUBLIC */
      .addCase(fetchPublicNotices.pending, (state) => { state.loading = true; })
      .addCase(fetchPublicNotices.fulfilled, (state, action: PayloadAction<INotice[]>) => {
        state.loading = false;
        state.publicNotices = action.payload;
      })
      .addCase(fetchNotices.pending, (state) => { state.loading = true; })
      .addCase(fetchNotices.fulfilled, (state, action: PayloadAction<INotice[]>) => {
        state.loading = false;
        state.notices = action.payload;
      })

      /* CREATE NOTICE - Fixes the persistence issue */
      .addCase(createNotice.pending, (state) => {
        state.uploading = true;
        state.error = undefined;
      })
      .addCase(createNotice.fulfilled, (state, action: PayloadAction<INotice>) => {
        state.uploading = false;
        // Unshift adds the new notice (with populated user name) to the top of the list
        state.notices.unshift(action.payload);
        
        if (action.payload.targetAudience === "ALL") {
          state.publicNotices.unshift(action.payload);
        }
      })
      .addCase(createNotice.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })

      /* SINGLE NOTICE VIEW */
      .addCase(fetchNoticeById.fulfilled, (state, action: PayloadAction<INotice>) => {
        state.notice = action.payload;
        // Sync the item in the list if it exists
        const index = state.notices.findIndex((n) => n._id === action.payload._id);
        if (index !== -1) state.notices[index] = action.payload;
      })

      /* UPDATE NOTICE */
      .addCase(updateNotice.pending, (state) => {
        state.uploading = true;
      })
      .addCase(updateNotice.fulfilled, (state, action: PayloadAction<INotice>) => {
        state.uploading = false;
        // Update item in all relevant state arrays
        state.notices = state.notices.map((n) => n._id === action.payload._id ? action.payload : n);
        state.publicNotices = state.publicNotices.map((n) => n._id === action.payload._id ? action.payload : n);
        
        if (state.notice?._id === action.payload._id) {
          state.notice = action.payload;
        }
      })

      /* DELETE NOTICE */
      .addCase(deleteNotice.fulfilled, (state, action: PayloadAction<string>) => {
        state.notices = state.notices.filter((n) => n._id !== action.payload);
        state.publicNotices = state.publicNotices.filter((n) => n._id !== action.payload);
      })

      /* DOWNLOAD COUNTER */
      .addCase(downloadNotice.fulfilled, (state, action: PayloadAction<string>) => {
        const notice = state.notices.find((n) => n._id === action.payload);
        if (notice) notice.stats.downloads += 1;
      });
  },
});

export const { clearNoticeError } = noticeSlice.actions;
export default noticeSlice.reducer;