import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  type Action,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
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

export const fetchEvents = createAsyncThunk<IEvent[], { filter?: EventFilter } | undefined, { rejectValue: string }>(
  "events/fetchAll",
  async (params, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/get`, {
        params,
        withCredentials: true,
        signal: thunkAPI.signal,
      });
      // Safety: Backend might wrap in { events: [] } or return []
      return Array.isArray(data) ? data : data.events || [];
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.name === 'CanceledError') throw err; 
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch registry events");
      }
      throw err;
    }
  }
);

export const fetchEventById = createAsyncThunk<IEvent, string, { rejectValue: string }>(
  "events/fetchOne",
  async (id, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/get/${id}`, {
        withCredentials: true,
      });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Record retrieval failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchPublicEvents = createAsyncThunk<IEvent[], { filter?: EventFilter } | undefined, { rejectValue: string }>(
  "events/fetchPublic",
  async (params, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/public`, { params });
      return Array.isArray(data) ? data : data.events || [];
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Public fetch failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const fetchPublicEventById = createAsyncThunk<IEvent, string, { rejectValue: string }>(
  "events/fetchPublicOne",
  async (id, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/public/${id}`);
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Public detail fetch failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const createEvent = createAsyncThunk<IEvent, FormData, { rejectValue: string }>(
  "events/create",
  async (formData, thunkAPI) => {
    try {
      const { data } = await api.post("/events/create", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Creation failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
    }
  }
);

export const updateEvent = createAsyncThunk<IEvent, { id: string; formData: FormData }, { rejectValue: string }>(
  "events/update",
  async ({ id, formData }, thunkAPI) => {
    try {
      const { data } = await api.put(`/events/update/${id}`, formData, {
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

export const deleteEvent = createAsyncThunk<string, string, { rejectValue: string }>(
  "events/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/events/delete/${id}`, { withCredentials: true });
      return id;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Deletion failed");
      }
      return thunkAPI.rejectWithValue("An unknown error occurred");
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
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.unshift(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.map((e) =>
          e._id === action.payload._id ? action.payload : e
        );
        if (state.event?._id === action.payload._id)
          state.event = action.payload;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter((e) => e._id !== action.payload);
      })

      .addMatcher(
        (action): action is Action => action.type.endsWith("/pending"),
        (state, action) => {
          state.loading = true;
          state.error = undefined;
          if (action.type.includes("fetchAll") || action.type.includes("fetchPublic")) {
            state.events = []; 
          }
        }
      )

      .addMatcher(
        (action): action is PayloadAction<IEvent[]> =>
          [fetchEvents.fulfilled.type, fetchPublicEvents.fulfilled.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.events = action.payload || [];
        }
      )

      .addMatcher(
        (action): action is PayloadAction<IEvent> =>
          [fetchEventById.fulfilled.type, fetchPublicEventById.fulfilled.type].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.event = action.payload;
        }
      )

      .addMatcher(
        (action): action is Action => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          // Use type guard to access meta and payload safely without 'any'
          const rejectedAction = action as PayloadAction<string | undefined, string, { aborted?: boolean }>;
          if (rejectedAction.meta?.aborted) return;
          
          state.error = rejectedAction.payload || "A registry connection error occurred";
        }
      );
  },
});

export const { clearEventError, clearSingleEvent } = eventSlice.actions;
export default eventSlice.reducer;