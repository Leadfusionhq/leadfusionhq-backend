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
    const data = error.response?.data as Record<string, any>;

    // ✅ 1. Try extracting Joi/celebrate validation error
    const validationMessage = data?.validation?.body?.message;

    // ✅ 2. Try custom "details" structure if present
    const detailMessage =
      Array.isArray(data.details) && typeof data.details[0]?.message === 'string'
        ? data.details[0].message
        : undefined;

    return (
      validationMessage ||
      detailMessage ||
      data?.message ||
      error.message
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
