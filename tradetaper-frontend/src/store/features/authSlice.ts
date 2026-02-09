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
      // SECURITY: Token is now in HTTP-only cookie, only store user data in localStorage
      if (typeof window !== 'undefined') {
        // Only store non-sensitive user data
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        // SECURITY: No longer storing token in localStorage
        // Token is managed by HTTP-only cookie set by backend
      }
    },
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        // SECURITY: Token is in HTTP-only cookie, will be cleared by backend on logout
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        // SECURITY: Token is in HTTP-only cookie, will be cleared by backend on logout
        // TODO: Call backend /auth/logout endpoint to clear cookie
      }
    },
    loadUserFromStorage(state) {
        if (typeof window !== 'undefined') {
            const userString = localStorage.getItem('user');
            // SECURITY: Token is now in HTTP-only cookie, we only restore user data
            // The cookie will be automatically sent with requests
            if (userString) {
                try {
                    const user = JSON.parse(userString) as UserResponseDto;
                    state.user = user;
                    state.isAuthenticated = true;
                    state.token = 'cookie'; // Placeholder - actual token is in HTTP-only cookie
                } catch (error) {
                    console.error("Error parsing user from localStorage", error);
                    localStorage.removeItem('user');
                }
            }
        }
    }
  },
});

export const {
  authRequest,
  authSuccess,
  authFailure,
  logout,
  loadUserFromStorage,
} = authSlice.actions;

export default authSlice.reducer;