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
  tokenExpiry?: number;
  rememberMe?: boolean;
}

interface AddressData {
  full_address: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  coordinates?: {
    lat: number | null;
    lng: number | null;
  };
  place_id?: string;
}

interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  phoneNumber: string;
  address: AddressData;
  terms: boolean;
}

interface RegisterUserResponse {
  message: string;
  user?: any;
}

export const loginUser = createAsyncThunk<LoginResponse & { rememberMe: boolean }, { email: string; password: string; role: string; rememberMe?: boolean }>(
  'auth/loginUser',
  async ({ email, password, role, rememberMe = false }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<LoginResponse>(API_URL.LOGIN_USER, { email, password, role, rememberMe });
      saveToken(data.token, rememberMe);
      return { ...data, rememberMe };
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
  RegisterUserResponse,
  RegisterUserPayload
>(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('📤 Registration Payload:', JSON.stringify(payload, null, 2));

      // ✅ Send complete payload to backend
      const data = await axiosWrapper('post', API_URL.REGISTER_USER, {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        companyName: payload.companyName,
        phoneNumber: payload.phoneNumber,
        address: {
          full_address: payload.address.full_address,
          street: payload.address.street,
          city: payload.address.city,
          state: payload.address.state,
          zip_code: payload.address.zip_code,
          coordinates: payload.address.coordinates,
          place_id: payload.address.place_id
        },
        terms: payload.terms
      });

      console.log('✅ Registration successful:', data);
      return data as RegisterUserResponse;

    } catch (err: unknown) {
      console.error('❌ Registration error:', err);

      // ✅ Type guard for axios error with response
      function isAxiosErrorWithResponse(error: unknown): error is {
        response: {
          data: {
            error?: string;
            message?: string;
            validation?: {
              body?: {
                message?: string;
                keys?: string[];
              };
            };
          };
          status?: number;
        };
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

      // ✅ Type guard for error with error property
      function hasErrorProp(error: unknown): error is { error: string } {
        return (
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as { error?: unknown }).error === 'string'
        );
      }

      // ✅ Handle different error formats
      if (isAxiosErrorWithResponse(err)) {
        const responseData = err.response.data;

        // Handle Joi validation errors
        if (responseData.validation?.body?.message) {
          console.error('Validation Error:', responseData.validation.body);
          return rejectWithValue(responseData.validation.body.message);
        }

        // Handle general errors
        const errorMessage =
          responseData.message ||
          responseData.error ||
          'Registration failed';

        return rejectWithValue(errorMessage);
      } else if (hasErrorProp(err)) {
        return rejectWithValue(err.error);
      } else {
        return rejectWithValue('An unexpected error occurred during registration');
      }
    }
  }
);
