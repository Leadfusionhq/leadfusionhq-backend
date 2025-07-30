// redux/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginUser, registerUser } from './authActions';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

// Enhanced error interface for verification cases
interface AuthError {
  message?: string;
  code?: string;
  email?: string;
}

interface AuthState {
  loading: boolean;
  user: User | null;
  token: string | null;
  error: string | AuthError | null; // Updated to handle both types
  success: boolean;
  message: string | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  loading: false,
  user: null,
  token: null,
  error: null,
  success: false,
  message: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      state.success = false;
      state.message = null;
      state.isLoggedIn = false;
    },
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.success = false;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isLoggedIn = false;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ token: string; user: User }>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isLoggedIn = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        // Handle both string and object errors
        state.error = action.payload as string | AuthError;
        state.isLoggedIn = false;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isLoggedIn = false;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.isLoggedIn = false; 
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isLoggedIn = false;
      });
  },
});

export const { logout, clearError, clearSuccess } = authSlice.actions;
export default authSlice.reducer;