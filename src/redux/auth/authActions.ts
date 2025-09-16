import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { saveToken } from '@/utils/auth';
import axiosWrapper from '@/utils/api';
import { API_URL } from '@/utils/apiUrl';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = createAsyncThunk<LoginResponse, { email: string; password: string; role: string}>(
  'auth/loginUser',
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<LoginResponse>(API_URL.LOGIN_USER, { email, password, role });
      saveToken(data.token);
      return data;
    } catch (err: unknown) {
      console.log('err', err);
      
      function isAxiosErrorWithResponse(error: unknown): error is { 
        response: { 
          data: { 
            error?: string;
            message?: string;
          } 
        } 
      } {
        return (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: unknown }).response === 'object' &&
          (error as { response?: unknown }).response !== null &&
          'data' in (error as { response?: { data?: unknown } }).response!
        );
      }
      
      if (isAxiosErrorWithResponse(err)) {
        // Check for both 'message' and 'error' fields from backend
        const errorMessage = err.response.data.message || err.response.data.error || 'Login failed';
        return rejectWithValue(errorMessage);
      }
      
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const registerUser = createAsyncThunk<{ message: string }, { name: string; email: string; password: string; companyName: string; phoneNumber: string;  }>(
  'auth/registerUser',
  async (
    { name, email, password, companyName, phoneNumber },
    { rejectWithValue }
  ) => {
    try {
      const data = await axiosWrapper('post', API_URL.REGISTER_USER, {
        name,
        email,
        password,
        companyName,
        phoneNumber,
     
      });
      return data as { message: string };
    } catch (err: unknown) {
      function isAxiosErrorWithResponse(error: unknown): error is { 
        response: { 
          data: { 
            error?: string;
            message?: string;
          } 
        } 
      } {
        return (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: unknown }).response === 'object' &&
          (error as { response?: unknown }).response !== null &&
          'data' in (error as { response?: { data?: unknown } }).response!
        );
      }
      
      function hasErrorProp(error: unknown): error is { error: string } {
        return (
          typeof error === 'object' &&
          error !== null &&
          'error' in error
        );
      }
      
      if (hasErrorProp(err)) {
        console.log(err.error);
      }
      
      if (isAxiosErrorWithResponse(err)) {
        // Check for both 'message' and 'error' fields from backend
        const errorMessage = err.response.data.message || err.response.data.error || 'Registration failed';
        return rejectWithValue(errorMessage);
      } else if (hasErrorProp(err)) {
        return rejectWithValue(err.error);
      } else {
        return rejectWithValue('An unexpected error occurred during registration');
      }
    }
  }
);