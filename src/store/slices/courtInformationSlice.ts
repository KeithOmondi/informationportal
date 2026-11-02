import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
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

interface CourtInfoResponse {
  divisions?: Division[];
  faqs?: FAQ[];
  contacts?: Contact[];
  data?: {
    divisions?: Division[];
    faqs?: FAQ[];
    contacts?: Contact[];
  };
}

const initialState: CourtState = {
  divisions: [],
  faqs: [],
  contacts: [],
  loading: false,
  error: null,
};

// ----------------- UTILS -----------------

const getErrorMessage = (err: unknown, defaultMsg: string): string => {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || defaultMsg;
  }
  return defaultMsg;
};

// ----------------- ASYNC THUNKS -----------------

export const fetchCourtInfo = createAsyncThunk<CourtInfoResponse, void, { rejectValue: string }>(
  "court/fetchCourtInfo",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<CourtInfoResponse>("/courts/all");
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch court info"));
    }
  }
);

/* --- DIVISION THUNKS --- */

export const createDivision = createAsyncThunk<Division, FormData, { rejectValue: string }>(
  "court/createDivision",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Division>("/courts/divisions", formData);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to create division"));
    }
  }
);

// This type supports both a full list of divisions or a single updated division
export type UpdateDivisionResult = Division | { divisions: Division[] };

export const updateDivision = createAsyncThunk<
  UpdateDivisionResult, 
  { id: string; formData: FormData }, 
  { rejectValue: string }
>(
  "court/updateDivision",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put<UpdateDivisionResult>(`/courts/divisions/${id}`, formData);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update division"));
    }
  }
);

export const deleteDivision = createAsyncThunk<string, string, { rejectValue: string }>(
  "court/deleteDivision",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/courts/divisions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete division"));
    }
  }
);

/* --- FAQ THUNKS --- */

export const createFaq = createAsyncThunk<FAQ, Omit<FAQ, "_id">, { rejectValue: string }>(
  "court/createFaq",
  async (faq, { rejectWithValue }) => {
    try {
      const { data } = await api.post<FAQ>("/courts/faqs", faq);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to create FAQ"));
    }
  }
);

export const updateFaq = createAsyncThunk<FAQ, { _id: string } & Partial<FAQ>, { rejectValue: string }>(
  "court/updateFaq",
  async (arg, { rejectWithValue }) => {
    try {
      const { _id, ...updateData } = arg;
      const { data } = await api.put<FAQ>(`/courts/faqs/${_id}`, updateData);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update FAQ"));
    }
  }
);

export const deleteFaq = createAsyncThunk<string, string, { rejectValue: string }>(
  "court/deleteFaq",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/courts/faqs/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete FAQ"));
    }
  }
);

/* --- CONTACT THUNKS --- */

export const createContact = createAsyncThunk<Contact, Omit<Contact, "_id">, { rejectValue: string }>(
  "court/createContact",
  async (contact, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Contact>("/courts/contacts", contact);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to create contact"));
    }
  }
);

export const updateContact = createAsyncThunk<Contact, Contact, { rejectValue: string }>(
  "court/updateContact",
  async ({ _id, ...contact }, { rejectWithValue }) => {
    try {
      const { data } = await api.put<Contact>(`/courts/contacts/${_id}`, contact);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update contact"));
    }
  }
);

export const deleteContact = createAsyncThunk<string, string, { rejectValue: string }>(
  "court/deleteContact",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/courts/contacts/${id}`);
      return id;
    } catch (err) {
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
        const source = action.payload.data || action.payload;
        state.divisions = source.divisions || [];
        state.faqs = source.faqs || [];
        state.contacts = source.contacts || [];
      })

      /* DIVISIONS */
      .addCase(createDivision.fulfilled, (state, action) => {
        state.divisions.push(action.payload);
        state.divisions.sort((a, b) => a.order - b.order);
        state.loading = false;
      })
      .addCase(updateDivision.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // Handle bulk list update or single item update
        if ('divisions' in payload) {
          state.divisions = payload.divisions;
        } else {
          const idx = state.divisions.findIndex((d) => d._id === payload._id);
          if (idx !== -1) {
            state.divisions[idx] = payload;
          }
        }
        state.divisions.sort((a, b) => a.order - b.order);
      })
      .addCase(deleteDivision.fulfilled, (state, action) => {
        state.divisions = state.divisions.filter((d) => d._id !== action.payload);
        state.loading = false;
      })

      /* FAQs */
      .addCase(createFaq.fulfilled, (state, action) => {
        state.faqs.unshift(action.payload);
        state.loading = false;
      })
      .addCase(updateFaq.fulfilled, (state, action) => {
        const idx = state.faqs.findIndex((f) => f._id === action.payload._id);
        if (idx !== -1) state.faqs[idx] = action.payload;
        state.loading = false;
      })
      .addCase(deleteFaq.fulfilled, (state, action) => {
        state.faqs = state.faqs.filter((f) => f._id !== action.payload);
        state.loading = false;
      })

      /* CONTACTS */
      .addCase(createContact.fulfilled, (state, action) => {
        state.contacts.unshift(action.payload);
        state.loading = false;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        const idx = state.contacts.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.contacts[idx] = action.payload;
        state.loading = false;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
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
        (state, action: PayloadAction<string | undefined>) => {
          state.error = action.payload ?? "An unexpected error occurred";
          state.loading = false;
        }
      );
  },
});

export const { clearError } = courtSlice.actions;
export default courtSlice.reducer;