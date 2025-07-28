// @ts-expect-error: Suppress import error for types
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import toast from 'react-hot-toast';

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    const { config, data } = response;
    const { method } = config as AxiosRequestConfig;

    if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
      if (data?.message === '') {
        return response;
      }

      toast.dismiss(); // Dismiss previous toasts
      const successMessage = data?.message || data?.desc || 'Operation successful';
      toast.success(successMessage, {
        position: 'top-right',
        duration: 2000,
        style: {
          background: '#4caf50',
          color: '#fff',
        },
      });
    }

    return response;
  },
  (error: unknown) => {
    let status: number | undefined;
    let statusText: string | undefined;
    let errorData: Record<string, unknown> = {};
    let errorMessage: string = '';
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: unknown }).response
    ) {
      const resp = (error as { response: { status?: number; statusText?: string; data?: Record<string, unknown> } }).response;
      status = resp.status;
      statusText = resp.statusText;
      errorData = resp.data || {};
      errorMessage = (errorData.message as string) || (errorData.desc as string) || (error as { message?: string }).message || '';
    } else {
      errorMessage = (error as { message?: string })?.message || 'Unknown error';
    }
    if (status === 401 || statusText === 'Unauthorized') {
      localStorage.clear();
      toast.dismiss(); // Dismiss previous toasts
      toast.error('Session expired or unauthorized. Please login again.', {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
      // Do NOT redirect here; let the component handle navigation if needed
    }
    let validationMessage = 'Validation error';
    if (errorData.validation && typeof errorData.validation === 'object' && 'body' in errorData.validation) {
      const body = (errorData.validation as Record<string, unknown>).body;
      if (body && typeof body === 'object' && 'message' in body) {
        validationMessage = (body as { message?: string }).message || validationMessage;
      }
    }
    if (errorMessage === 'Validation failed') {
      toast.dismiss(); // Dismiss previous toasts
      toast.error(validationMessage, {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
    } else {
      toast.dismiss(); // Dismiss previous toasts
      toast.error(errorMessage, {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
    }
    return Promise.reject(error);
  }
);

const axiosWrapper = async (
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: Record<string, unknown>,
  token?: string,
  isFormData = false
): Promise<unknown> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    };

    if (token) {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as { isAxiosError?: boolean }).isAxiosError
    ) {
      const err = error as { response?: { data?: unknown } };
      return Promise.reject(err.response && err.response.data ? err.response.data : error);
    }
    return Promise.reject(error);
  }
};

export default axiosWrapper;
