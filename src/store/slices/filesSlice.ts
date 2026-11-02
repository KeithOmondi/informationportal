import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "../../api/axios";

// --- Interfaces ---

interface FileData {
  _id: string;
  url: string;
  publicId: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

interface FileState {
  files: FileData[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

const initialState: FileState = {
  files: [],
  loading: false,
  error: null,
  uploadProgress: 0,
};

// --- Async Thunks ---

export const fetchFiles = createAsyncThunk<FileData[], void, { rejectValue: string }>(
  "files/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get<FileData[]>("/files/get");
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch files");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const uploadFile = createAsyncThunk<FileData, File, { rejectValue: string }>(
  "files/upload",
  async (file, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<FileData>("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Upload failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const downloadFile = createAsyncThunk<string, { id: string; fileName: string }, { rejectValue: string }>(
  "files/download",
  async ({ id, fileName }, thunkAPI) => {
    try {
      const response = await api.get(`/files/${id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up memory

      return id;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Download failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const deleteFile = createAsyncThunk<string, string, { rejectValue: string }>(
  "files/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/files/${id}`);
      return id;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Delete failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

// --- The Slice ---

const fileSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    clearFileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Files
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch files";
      })

      // Upload File
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.files.unshift(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Upload failed";
      })

      // Delete File
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((f) => f._id !== action.payload);
      })

      // Download File Rejected
      .addCase(downloadFile.rejected, (state, action) => {
        state.error = action.payload ?? "Download failed";
      });
  },
});

export const { clearFileError } = fileSlice.actions;
export default fileSlice.reducer;