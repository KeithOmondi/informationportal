import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  isAnyOf,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

/* =====================================================
   TYPES
===================================================== */
export type GuestType = "ADULT" | "MINOR";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type GuestListStatus = "DRAFT" | "SUBMITTED";

export interface IGuest {
  name?: string;
  type?: GuestType;
  gender?: Gender;
  idNumber?: string;
  birthCertNumber?: string;
  phone?: string;
  email?: string;
}

export interface IJudgeGuest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  guests: IGuest[];
  status: GuestListStatus;
  createdAt: string;
  updatedAt: string;
}

interface GuestState {
  guestList: IJudgeGuest | null;
  allGuestLists: IJudgeGuest[];
  loading: boolean;
  error: string | null;
}

const initialState: GuestState = {
  guestList: null,
  allGuestLists: [],
  loading: false,
  error: null,
};

/* =====================================================
   THUNKS
===================================================== */

const getErrorMessage = (err: any, fallback: string) =>
  err.response?.data?.message || err.message || fallback;

// --- EXISTING ACTIONS ---

export const fetchMyGuestList = createAsyncThunk(
  "guests/fetchMyGuestList",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/guests/me");
      return (data.data || data) as IJudgeGuest;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch guest list"));
    }
  }
);

export const saveGuestList = createAsyncThunk(
  "guests/saveGuestList",
  async (guests: IGuest[], { rejectWithValue }) => {
    try {
      const { data } = await api.post("/guests/save", { guests });
      return (data.data || data) as IJudgeGuest;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to save draft"));
    }
  }
);

export const submitGuestList = createAsyncThunk(
  "guests/submitGuestList",
  async (guests: IGuest[], { rejectWithValue }) => {
    try {
      const { data } = await api.post("/guests/submit", { guests });
      return (data.data || data) as IJudgeGuest;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to submit guest list"));
    }
  }
);

// --- REPORTING ACTIONS (NEW) ---

/**
 * Downloads the Master PDF Report for Admin
 */
export const downloadAllGuestsReport = createAsyncThunk(
  "guests/downloadAllReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/guests/all/report", {
        responseType: "blob", // CRITICAL: Tells axios to handle binary data
      });

      // Trigger Browser Download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Master_Guest_Registry_${new Date().toLocaleDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return null;
    } catch (err: any) {
      return rejectWithValue("Failed to download master report");
    }
  }
);

/**
 * Downloads a Individual Judge's PDF Report
 */
export const downloadJudgeReport = createAsyncThunk(
  "guests/downloadIndividualReport",
  async ({ userId, judgeName }: { userId: string; judgeName: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/guests/report/${userId}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Guest_List_${judgeName.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return null;
    } catch (err: any) {
      return rejectWithValue("Failed to download judge report");
    }
  }
);

// --- ADMIN ACTIONS ---

export const fetchAllGuestLists = createAsyncThunk(
  "guests/fetchAllGuestLists",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/guests/admin/all");
      return (data.data || data) as IJudgeGuest[];
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch all guest lists"));
    }
  }
);

/* =====================================================
   SLICE
===================================================== */

const guestSlice = createSlice({
  name: "guests",
  initialState,
  reducers: {
    resetGuestState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllGuestLists.fulfilled, (state, action) => {
        state.loading = false;
        state.allGuestLists = action.payload;
      })
      // Reporting thunks don't need to store data in state, just clear loading
      .addMatcher(
        isAnyOf(downloadAllGuestsReport.fulfilled, downloadJudgeReport.fulfilled),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        isAnyOf(
          fetchMyGuestList.fulfilled,
          saveGuestList.fulfilled,
          submitGuestList.fulfilled
        ),
        (state, action: PayloadAction<IJudgeGuest>) => {
          state.loading = false;
          state.guestList = action.payload;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("guests/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("guests/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload || "An unexpected error occurred";
        }
      );
  },
});

export const { resetGuestState } = guestSlice.actions;
export default guestSlice.reducer;