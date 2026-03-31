import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api/axios";

// ----------------- TYPES -----------------

export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";
export type AudienceRole = "judge" | "dr" | "all";

export interface DivisionContent {
  _id: string;
  type: ContentType;
  body?: string;
  url?: string;
  publicId?: string;
  fileName?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface Division {
  _id: string;
  name: string;
  title: string;
  description?: string;
  order: number;
  content: DivisionContent[];
  targetAudience: AudienceRole;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  targetAudience: AudienceRole;
}

export interface Contact {
  _id: string;
  title: string;
  detail: string;
  sub?: string;
  targetAudience: AudienceRole;
}

interface CourtState {
  divisions: Division[];
  faqs: FAQ[];
  contacts: Contact[];
  loading: boolean;
  error: string | null;
}

const initialState: CourtState = {
  divisions: [],
  faqs: [],
  contacts: [],
  loading: false,
  error: null,
};

// ----------------- UTILS -----------------

const getErrorMessage = (err: any, defaultMsg: string) =>
  err.response?.data?.message || defaultMsg;

// ----------------- ASYNC THUNKS -----------------

export const fetchCourtInfo = createAsyncThunk(
  "court/fetchCourtInfo",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/courts/all");
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch court info"));
    }
  }
);

/* --- DIVISION THUNKS --- */

export const createDivision = createAsyncThunk(
  "court/createDivision",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/courts/divisions", formData);
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to create division"));
    }
  }
);

export const updateDivision = createAsyncThunk(
  "court/updateDivision",
  async ({ id, formData }: { id: string; formData: FormData | any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/courts/divisions/${id}`, formData);
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to update division"));
    }
  }
);

export const deleteDivision = createAsyncThunk(
  "court/deleteDivision",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/courts/divisions/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete division"));
    }
  }
);

/* --- FAQ THUNKS --- */

export const createFaq = createAsyncThunk(
  "court/createFaq",
  async (faq: Omit<FAQ, "_id">, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/courts/faqs", faq);
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to create FAQ"));
    }
  }
);

export const updateFaq = createAsyncThunk(
  "court/updateFaq",
  async (arg: { _id: string } & Partial<FAQ>, { rejectWithValue }) => {
    try {
      const { _id, ...updateData } = arg;
      const { data } = await api.put(`/courts/faqs/${_id}`, updateData);
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to update FAQ"));
    }
  }
);

export const deleteFaq = createAsyncThunk(
  "court/deleteFaq",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/courts/faqs/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete FAQ"));
    }
  }
);

/* --- CONTACT THUNKS --- */

export const createContact = createAsyncThunk(
  "court/createContact",
  async (contact: Omit<Contact, "_id">, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/courts/contacts", contact);
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to create contact"));
    }
  }
);

export const updateContact = createAsyncThunk(
  "court/updateContact",
  async ({ _id, ...contact }: Contact, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/courts/contacts/${_id}`, contact);
      return data;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to update contact"));
    }
  }
);

export const deleteContact = createAsyncThunk(
  "court/deleteContact",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/courts/contacts/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete contact"));
    }
  }
);

// ----------------- SLICE -----------------

const courtSlice = createSlice({
  name: "court",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* FETCH ALL */
      .addCase(fetchCourtInfo.fulfilled, (state, action) => {
        state.loading = false;
        // Check if data is nested under a property or returned directly
        const source = action.payload?.data || action.payload;
        
        state.divisions = source.divisions || [];
        state.faqs = source.faqs || [];
        state.contacts = source.contacts || [];
      })

      /* DIVISIONS */
      .addCase(createDivision.fulfilled, (state, action: PayloadAction<Division>) => {
        state.divisions.push(action.payload);
        state.divisions.sort((a, b) => (a.order || 0) - (b.order || 0));
        state.loading = false;
      })
      .addCase(updateDivision.fulfilled, (state, action: PayloadAction<any>) => {
        if (action.payload.divisions) {
          state.divisions = action.payload.divisions;
        } else {
          const idx = state.divisions.findIndex((d) => d._id === action.payload._id);
          if (idx !== -1) {
            state.divisions[idx] = action.payload;
          }
        }
        state.divisions.sort((a, b) => (a.order || 0) - (b.order || 0));
        state.loading = false;
      })
      .addCase(deleteDivision.fulfilled, (state, action: PayloadAction<string>) => {
        state.divisions = state.divisions.filter((d) => d._id !== action.payload);
        state.loading = false;
      })

      /* FAQs */
      .addCase(createFaq.fulfilled, (state, action: PayloadAction<FAQ>) => {
        state.faqs.unshift(action.payload);
        state.loading = false;
      })
      .addCase(updateFaq.fulfilled, (state, action: PayloadAction<FAQ>) => {
        const idx = state.faqs.findIndex((f) => f._id === action.payload._id);
        if (idx !== -1) state.faqs[idx] = action.payload;
        state.loading = false;
      })
      .addCase(deleteFaq.fulfilled, (state, action: PayloadAction<string>) => {
        state.faqs = state.faqs.filter((f) => f._id !== action.payload);
        state.loading = false;
      })

      /* CONTACTS */
      .addCase(createContact.fulfilled, (state, action: PayloadAction<Contact>) => {
        state.contacts.unshift(action.payload);
        state.loading = false;
      })
      .addCase(updateContact.fulfilled, (state, action: PayloadAction<Contact>) => {
        const idx = state.contacts.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.contacts[idx] = action.payload;
        state.loading = false;
      })
      .addCase(deleteContact.fulfilled, (state, action: PayloadAction<string>) => {
        state.contacts = state.contacts.filter((c) => c._id !== action.payload);
        state.loading = false;
      })

      /* GLOBAL MATCHERS */
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action.payload;
          state.loading = false;
        }
      );
  },
});

export const { clearError } = courtSlice.actions;
export default courtSlice.reducer;