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

export const registerUser = createAsyncThunk<
  { message: string }, 
  { name: string; email: string; password: string; companyName: string; phoneNumber: string; zipCode: string }
>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosWrapper('post', API_URL.REGISTER_USER, userData);
      return data as { message: string };
    } catch (err: any) {
      console.log('Registration error:', err);

      // Handle axios response error
      if (err?.response?.data) {
        const errorData = err.response.data;
        
        // Handle validation errors from backend
        if (errorData.validation?.body?.message) {
          return rejectWithValue(errorData.validation.body.message);
        }
        
        // Handle general error messages
        if (errorData.message) {
          return rejectWithValue(errorData.message);
        }
        
        if (errorData.error) {
          return rejectWithValue(errorData.error);
        }
        
        // Handle validation errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const firstError = errorData.errors[0];
          return rejectWithValue(firstError.message || firstError);
        }
        
        return rejectWithValue('Registration failed');
      }
      // Handle network or other errors
      if (err?.message) {
        return rejectWithValue(err.message);
      }
      // Handle direct error property (from your axiosWrapper)
      if (err?.error) {
        return rejectWithValue(err.error);
      }
      

      
      return rejectWithValue('An unexpected error occurred during registration');
    }
  }
);

// export const registerUser = createAsyncThunk<{ message: string }, { name: string; email: string; password: string; companyName: string; phoneNumber: string; zipCode: string }>(
//   'auth/registerUser',
//   async (
//     { name, email, password, companyName, phoneNumber, zipCode },
//     { rejectWithValue }
//   ) => {
//     try {
//       const data = await axiosWrapper('post', API_URL.REGISTER_USER, {
//         name,
//         email,
//         password,
//         companyName,
//         phoneNumber,
//         zipCode,
//       });
//       return data as { message: string };
//     } catch (err: unknown) {
//       console.log('err', err);

//       function isAxiosErrorWithResponse(error: unknown): error is { 
//         response: { 
//           data: { 
//             error?: string;
//             message?: string;
//           } 
//         } 
//       } {
//         return (
//           typeof error === 'object' &&
//           error !== null &&
//           'response' in error &&
//           typeof (error as { response?: unknown }).response === 'object' &&
//           (error as { response?: unknown }).response !== null &&
//           'data' in (error as { response?: { data?: unknown } }).response!
//         );
//       }
      
//       function hasErrorProp(error: unknown): error is { error: string } {
//         return (
//           typeof error === 'object' &&
//           error !== null &&
//           'error' in error
//         );
//       }
      
//       if (hasErrorProp(err)) {
//         console.log(err.error);
//       }
      
//       if (isAxiosErrorWithResponse(err)) {
//         // Check for both 'message' and 'error' fields from backend
//         console.log(err);
//         const errorMessage = err.response.data.message || err.response.data.error || 'Registration failed';
//         return rejectWithValue(errorMessage);
//       } else if (hasErrorProp(err)) {
//         return rejectWithValue(err.error);
//       } else {
//         return rejectWithValue('An unexpected error occurred during registration');
//       }
//     }
//   }
// );