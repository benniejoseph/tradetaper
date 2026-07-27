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

/**
 * The main backend authenticates with an httpOnly cookie, but the TaperAI Desk
 * runs as a separate Cloud Run service that only accepts `Authorization: Bearer`.
 * Redux is not persisted, so without this the access token is lost on every
 * reload — the user stays logged in via the cookie while every Desk call 401s.
 * Kept in sessionStorage (tab-scoped, cleared on tab close) rather than
 * localStorage to limit the exposure window.
 */
const TOKEN_KEY = 'tt_access_token';

const readStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeStoredToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode / storage disabled — Desk auth degrades, app still works */
  }
};

export const getStoredAccessToken = readStoredToken;

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
      writeStoredToken(state.token);
    },
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
      writeStoredToken(null);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      writeStoredToken(null);
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
        // The cookie re-authenticated us but carries no bearer token; restore
        // the one saved at login so Bearer-only services (TaperAI Desk) work.
        state.token = action.payload?.accessToken ?? readStoredToken();
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        writeStoredToken(null);
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
