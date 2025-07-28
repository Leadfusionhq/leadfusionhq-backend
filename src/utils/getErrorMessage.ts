export function isAxiosError(
  error: unknown
): error is { isAxiosError: boolean; response?: { data?: { message?: string } }; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    typeof (error as Record<string, unknown>).isAxiosError === 'boolean' &&
    (error as { isAxiosError: boolean }).isAxiosError === true
  );
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
