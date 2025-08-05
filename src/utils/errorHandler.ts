// utils/errorHandler.ts

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

interface ApiError {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message?: string;
  code?: string;
}

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  const apiError = error as ApiError;
  
  // Check for API response error message
  if (apiError?.response?.data?.message) {
    return apiError.response.data.message;
  }
  
  // Check for API response error field
  if (apiError?.response?.data?.error) {
    return apiError.response.data.error;
  }
  
  // Check for general error message
  if (apiError?.message) {
    return apiError.message;
  }

  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return apiError?.code === 'NETWORK_ERROR' || 
         apiError?.code === 'ENOTFOUND' ||
         !apiError?.response;
};

export const getStatusCode = (error: unknown): number | null => {
  const apiError = error as ApiError;
  return apiError?.response?.status || null;
};