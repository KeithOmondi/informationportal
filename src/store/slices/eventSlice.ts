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

export interface IEvent {
  _id: string;
  title: string;
  description: string;
  location: string;
  startDate: string; // ISO String from Backend
  endDate: string;   // ISO String from Backend
  status: EventStatus;
  isMandatory: boolean;
  capacity?: number;
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
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch events",
      );
    }
  },
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
        err.response?.data?.message || "Failed to fetch event",
      );
    }
  },
);

export const fetchPublicEvents = createAsyncThunk(
  "events/fetchPublic",
  async (params: { filter?: EventFilter } | undefined, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/public`, { params });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Public fetch failed",
      );
    }
  },
);

export const fetchPublicEventById = createAsyncThunk(
  "events/fetchPublicOne",
  async (id: string, thunkAPI) => {
    try {
      const { data } = await api.get(`/events/public/${id}`);
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Public detail fetch failed",
      );
    }
  },
);

export const createEvent = createAsyncThunk(
  "events/create",
  async (formData: Partial<IEvent>, thunkAPI) => {
    try {
      const { data } = await api.post("/events/create", formData, {
        withCredentials: true,
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Creation failed",
      );
    }
  },
);

export const updateEvent = createAsyncThunk(
  "events/update",
  async (
    { id, formData }: { id: string; formData: Partial<IEvent> },
    thunkAPI,
  ) => {
    try {
      const { data } = await api.put(`/events/update/${id}`, formData, {
        withCredentials: true,
      });
      return data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Update failed",
      );
    }
  },
);

export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/events/delete/${id}`, { withCredentials: true });
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Deletion failed",
      );
    }
  },
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
      .addCase(
        createEvent.fulfilled,
        (state, action: PayloadAction<IEvent>) => {
          state.loading = false;
          state.events.unshift(action.payload);
        },
      )
      .addCase(
        updateEvent.fulfilled,
        (state, action: PayloadAction<IEvent>) => {
          state.loading = false;
          state.events = state.events.map((e) =>
            e._id === action.payload._id ? action.payload : e,
          );
          if (state.event?._id === action.payload._id)
            state.event = action.payload;
        },
      )
      .addCase(
        deleteEvent.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.events = state.events.filter((e) => e._id !== action.payload);
        },
      )

      /* ---------- Matchers ---------- */
      .addMatcher(
        (action: Action): action is Action & { type: string } =>
          action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = undefined;
        },
      )
      .addMatcher(
        (action: Action): action is PayloadAction<string> =>
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || "An unexpected error occurred";
        },
      )
      .addMatcher(
        (action: Action): action is PayloadAction<IEvent[]> =>
          [
            fetchEvents.fulfilled.type,
            fetchPublicEvents.fulfilled.type,
          ].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.events = action.payload;
        },
      )
      .addMatcher(
        (action: Action): action is PayloadAction<IEvent> =>
          [
            fetchEventById.fulfilled.type,
            fetchPublicEventById.fulfilled.type,
          ].includes(action.type),
        (state, action) => {
          state.loading = false;
          state.event = action.payload;
        },
      );
  },
});

export const { clearEventError, clearSingleEvent } = eventSlice.actions;
export default eventSlice.reducer;