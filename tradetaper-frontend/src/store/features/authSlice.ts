// src/store/features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserResponseDto } from '@/types/user'; // We'll create this type

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
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authRequest(state) {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess(state, action: PayloadAction<{ token: string; user: UserResponseDto }>) {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
    loadUserFromStorage(state) {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const userString = localStorage.getItem('user');
            if (token && userString) {
                try {
                    const user = JSON.parse(userString) as UserResponseDto;
                    state.token = token;
                    state.user = user;
                    state.isAuthenticated = true;
                } catch (error) {
                    console.error("Error parsing user from localStorage", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
        }
    },
    updateUser(state, action: PayloadAction<UserResponseDto>) {
      state.user = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload));
      }
    },
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
