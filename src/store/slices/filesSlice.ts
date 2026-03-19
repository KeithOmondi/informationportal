import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
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

// Matches: GET /get
export const fetchFiles = createAsyncThunk("files/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/files/get"); 
    return response.data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch files");
  }
});

// Matches: POST /upload
export const uploadFile = createAsyncThunk(
  "files/upload",
  async (file: File, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Upload failed");
    }
  }
);

// Matches: GET /:id/download
export const downloadFile = createAsyncThunk(
  "files/download",
  async ({ id, fileName }: { id: string; fileName: string }, thunkAPI) => {
    try {
      const response = await api.get(`/files/${id}/download`, {
        responseType: "blob", // Important for file downloads
      });

      // Logic to trigger browser download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Download failed");
    }
  }
);

// Matches: DELETE /:id
export const deleteFile = createAsyncThunk(
  "files/delete",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/files/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Delete failed");
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
      .addCase(fetchFiles.fulfilled, (state, action: PayloadAction<FileData[]>) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Upload File
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadFile.fulfilled, (state, action: PayloadAction<FileData>) => {
        state.loading = false;
        state.files.unshift(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete File
      .addCase(deleteFile.fulfilled, (state, action: PayloadAction<string>) => {
        state.files = state.files.filter((f) => f._id !== action.payload);
      })
      
      // Download File (Optional: track loading state for UI spinners)
      .addCase(downloadFile.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearFileError } = fileSlice.actions;
export default fileSlice.reducer;