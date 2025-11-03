import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { NotePreview } from '../../../../shared/src/types';
import { getNotesSample } from '../../api/client';

export interface NotesState {
  sample: NotePreview | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
}

const initialState: NotesState = {
  sample: null,
  status: 'idle',
};

export const fetchSampleNote = createAsyncThunk('notes/fetchSample', async () => {
  const data = await getNotesSample();
  return data;
});

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearSample(state) {
      state.sample = null;
      state.status = 'idle';
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSampleNote.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchSampleNote.fulfilled, (state, action: PayloadAction<NotePreview>) => {
        state.status = 'succeeded';
        state.sample = action.payload;
      })
      .addCase(fetchSampleNote.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Request failed';
      });
  },
});

export const { clearSample } = notesSlice.actions;
export default notesSlice.reducer;
