import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserResponseDto } from '@/types/user'; // We'll create this type
import { authApiClient } from '@/services/api';

interface AuthState {
  user: UserResponseDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApiClient.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current user profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authRequest(state) {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess(state, action: PayloadAction<{ token?: string | null; user: UserResponseDto }>) {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token ?? null;
      state.user = action.payload.user;
      state.error = null;
    },
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    loadUserFromStorage(state) {
      // Cookie-based auth bootstrap happens via fetchCurrentUser in providers.
      state.isLoading = true;
    },
    updateUser(state, action: PayloadAction<UserResponseDto>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = (action.payload as string) || 'Failed to fetch current user profile';
      });
  },
});

export const {
  authRequest,
  authSuccess,
  authFailure,
  logout,
  loadUserFromStorage,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
