import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  type Action,
} from "@reduxjs/toolkit";
import { api } from "../../api/axios";

/* ================= TYPES ================= */

export type EventFilter = "UPCOMING" | "PAST" | "RECENT" | "ALL";
export type EventStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type EventAudience = "JUDGES" | "DR" | "ALL";

export interface IEvent {
  _id: string;
  title: string;
  description: string;
  location: string;
  startDate: string; 
  endDate: string;   
  status: EventStatus;
  targetAudience: EventAudience;
  isMandatory: boolean;
  capacity?: number;
  image?: {
    url: string;
    publicId: string;
  };
  createdBy: string | { _id: string; name: string; role: string };
  createdAt: string;
  updatedAt?: string;
}

interface EventState {
  events: IEvent[];
  event?: IEvent;
  loading: boolean;
  error?: string;
}

const initialState: EventState = {
  events: [],
  loading: false,
};

/* ================= THUNKS ================= */

export const fetchEvents = createAsyncThunk(
  "events/fetchAll",
  async (params: { filter?: EventFilter } | undefined, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/get`, {
        params,
        withCredentials: true,
        signal: thunkAPI.signal, // Crucial for stopping "Abnormal Reloads"
      });
      // Safety: Ensure we always return an array to the fulfill matcher
      return Array.isArray(data) ? data : data.events || [];
    } catch (err: any) {
      if (err.name === 'CanceledError') throw err; 
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch registry events"
      );
    }
  }
);

export const fetchEventById = createAsyncThunk(
  "events/fetchOne",
  async (id: string, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/get/${id}`, {
        withCredentials: true,
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Record retrieval failed"
      );
    }
  }
);

export const fetchPublicEvents = createAsyncThunk(
  "events/fetchPublic",
  async (params: { filter?: EventFilter } | undefined, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/public`, { params });
      return Array.isArray(data) ? data : data.events || [];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Public fetch failed"
      );
    }
  }
);

export const fetchPublicEventById = createAsyncThunk(
  "events/fetchPublicOne",
  async (id: string, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/public/${id}`);
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Public detail fetch failed"
      );
    }
  }
);

export const createEvent = createAsyncThunk(
  "events/create",
  async (formData: FormData, thunkAPI) => {
    try {
      const { data } = await api.post("/events/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Creation failed"
      );
    }
  }
);

export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ id, formData }: { id: string; formData: FormData }, thunkAPI) => {
    try {
      const { data } = await api.put(`/events/update/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Update failed"
      );
    }
  }
);

export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/events/delete/${id}`, { withCredentials: true });
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Deletion failed"
      );
    }
  }
);

/* ================= SLICE ================= */

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearEventError: (state) => {
      state.error = undefined;
    },
    clearSingleEvent: (state) => {
      state.event = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------- Fulfillment Handlers ---------- */
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<IEvent>) => {
        state.loading = false;
        state.events.unshift(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<IEvent>) => {
        state.loading = false;
        state.events = state.events.map((e) =>
          e._id === action.payload._id ? action.payload : e
        );
        if (state.event?._id === action.payload._id)
          state.event = action.payload;
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.events = state.events.filter((e) => e._id !== action.payload);
      })

      /* ---------- Matchers (Unified State Management) ---------- */
      
      // 1. PENDING: Global loading trigger
      .addMatcher(
        (action): action is Action => action.type.endsWith("/pending"),
        (state, action) => {
          state.loading = true;
          state.error = undefined;
          // Only clear event list if we are fetching a NEW list, not an update/delete
          if (action.type.includes("fetchAll") || action.type.includes("fetchPublic")) {
            state.events = []; 
          }
        }
      )

      // 2. FULFILLED (Lists): Update main event array
      .addMatcher(
        (action): action is PayloadAction<IEvent[]> =>
          [fetchEvents.fulfilled.type, fetchPublicEvents.fulfilled.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.events = action.payload || [];
        }
      )

      // 3. FULFILLED (Single): Update detailed view
      .addMatcher(
        (action): action is PayloadAction<IEvent> =>
          [fetchEventById.fulfilled.type, fetchPublicEventById.fulfilled.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.event = action.payload;
        }
      )

      // 4. REJECTED / ABORTED: Kill loading safely
      .addMatcher(
        (action): action is Action => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          // If aborted by the AbortController in useEffect, don't set an error message
          if (action.meta?.aborted) return;
          
          state.error = action.payload || "A registry connection error occurred";
        }
      );
  },
});

export const { clearEventError, clearSingleEvent } = eventSlice.actions;
export default eventSlice.reducer;