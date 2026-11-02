import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "../../api/axios";

/* ================= TYPES ================= */
export type NoticePriority = "NORMAL" | "URGENT";
export type TargetAudience = "ALL" | "JUDGES" | "DR";

export interface IAttachment {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
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

export const fetchPublicNotices = createAsyncThunk<INotice[], { priority?: string; search?: string } | undefined, { rejectValue: string }>(
  "notices/fetchPublic",
  async (params, thunkAPI) => {
    try {
      const { data } = await api.get<INotice[]>(`/notices/public`, { params });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch public notices");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchNotices = createAsyncThunk<INotice[], { priority?: string; search?: string } | undefined, { rejectValue: string }>(
  "notices/fetchAll",
  async (params, thunkAPI) => {
    try {
      const { data } = await api.get<INotice[]>(`/notices`, {
        params,
        withCredentials: true,
      });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch notices");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const createNotice = createAsyncThunk<INotice, FormData, { rejectValue: string }>(
  "notices/create",
  async (formData, thunkAPI) => {
    try {
      const { data } = await api.post<INotice>(`/notices/create`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Upload failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchNoticeById = createAsyncThunk<INotice, string, { rejectValue: string }>(
  "notices/fetchOne",
  async (id, thunkAPI) => {
    try {
      const { data } = await api.get<INotice>(`/notices/${id}`, { withCredentials: true });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Fetch failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const updateNotice = createAsyncThunk<INotice, { id: string; formData: FormData }, { rejectValue: string }>(
  "notices/update",
  async ({ id, formData }, thunkAPI) => {
    try {
      const { data } = await api.put<INotice>(`/notices/update/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Update failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const deleteNotice = createAsyncThunk<string, string, { rejectValue: string }>(
  "notices/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/notices/delete/${id}`, { withCredentials: true });
      return id;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Delete failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const downloadNotice = createAsyncThunk<string, string, { rejectValue: string }>(
  "notices/download",
  async (id, thunkAPI) => {
    try {
      const { data } = await api.get<{ url: string }>(`/notices/download/${id}`, { withCredentials: true });
      if (data.url) window.open(data.url, "_blank");
      return id;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Download failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
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
      /* FETCH LOGIC */
      .addCase(fetchPublicNotices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPublicNotices.fulfilled, (state, action) => {
        state.loading = false;
        state.publicNotices = action.payload;
      })
      .addCase(fetchNotices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.loading = false;
        state.notices = action.payload;
      })

      /* CREATE */
      .addCase(createNotice.pending, (state) => {
        state.uploading = true;
        state.error = undefined;
      })
      .addCase(createNotice.fulfilled, (state, action) => {
        state.uploading = false;
        state.notices.unshift(action.payload);
        if (action.payload.targetAudience === "ALL") {
          state.publicNotices.unshift(action.payload);
        }
      })
      .addCase(createNotice.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })

      /* SINGLE VIEW */
      .addCase(fetchNoticeById.fulfilled, (state, action) => {
        state.notice = action.payload;
        const index = state.notices.findIndex((n) => n._id === action.payload._id);
        if (index !== -1) state.notices[index] = action.payload;
      })

      /* UPDATE */
      .addCase(updateNotice.pending, (state) => {
        state.uploading = true;
      })
      .addCase(updateNotice.fulfilled, (state, action) => {
        state.uploading = false;
        state.notices = state.notices.map((n) => (n._id === action.payload._id ? action.payload : n));

        if (action.payload.targetAudience !== "ALL") {
          state.publicNotices = state.publicNotices.filter((n) => n._id !== action.payload._id);
        } else {
          state.publicNotices = state.publicNotices.map((n) => (n._id === action.payload._id ? action.payload : n));
        }

        if (state.notice?._id === action.payload._id) {
          state.notice = action.payload;
        }
      })

      /* DELETE */
      .addCase(deleteNotice.fulfilled, (state, action) => {
        state.notices = state.notices.filter((n) => n._id !== action.payload);
        state.publicNotices = state.publicNotices.filter((n) => n._id !== action.payload);
      })

      /* STATS TRACKING */
      .addCase(downloadNotice.fulfilled, (state, action) => {
        const notice = state.notices.find((n) => n._id === action.payload);
        if (notice) notice.stats.downloads += 1;
      })
      
      /* GLOBAL REJECTED HANDLER */
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          // Only set error if not already handled by a specific case (like createNotice)
          if (!state.error) {
            state.error = action.payload || "An unexpected error occurred";
          }
        }
      );
  },
});

export const { clearNoticeError } = noticeSlice.actions;
export default noticeSlice.reducer;