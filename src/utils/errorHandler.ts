// utils/errorHandler.ts

interface ApiErrorResponse {
  message?: string;
  error?: string;
  validation?: {
    body?: {
      message?: string;
    };
  };
  details?: Array<{ message?: string }>;
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
  const data = apiError?.response?.data;

  // 1️⃣ Joi/celebrate validation error (new, SAFE)
  const validationMessage = data?.validation?.body?.message;

  // 2️⃣ Custom validator: details[]
  const detailMessage =
    Array.isArray(data?.details) && typeof data.details[0]?.message === 'string'
      ? data.details[0].message
      : undefined;

  // 3️⃣ Your original logic (unchanged)
  const messageFromAPI = data?.message;
  const errorField = data?.error;
  const genericMessage = apiError?.message;

  return (
    validationMessage ||   // NEW
    detailMessage ||       // NEW
    messageFromAPI ||      // OLD
    errorField ||          // OLD
    genericMessage ||      // OLD
    'An unexpected error occurred'
  );
};

export const isNetworkError = (error: unknown): boolean => {
  const apiError = error as ApiError;
  return (
    apiError?.code === 'NETWORK_ERROR' ||
    apiError?.code === 'ENOTFOUND' ||
    !apiError?.response
  );
};

export const getStatusCode = (error: unknown): number | null => {
  const apiError = error as ApiError;
  return apiError?.response?.status || null;
};
