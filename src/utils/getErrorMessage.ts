export function isAxiosError(error: unknown): error is {
  isAxiosError: boolean;
  response?: { data?: any };
  message: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as any).isAxiosError === true
  );
}

export function getErrorMessage(error: unknown): string {
  console.log("🔥 FULL ERROR:", JSON.stringify(error, null, 2));

  // 1️⃣ If Axios error → handle normally
  if (isAxiosError(error)) {
    const data = error.response?.data || {};

    const validationMessage = data?.validation?.body?.message;

    const detailMessage =
      Array.isArray(data?.details) &&
      typeof data.details[0]?.message === "string"
        ? data.details[0].message
        : undefined;

    return (
      validationMessage ||
      detailMessage ||
      data?.message ||
      error.message
    );
  }

  // 2️⃣ NON-AXIOS but structured backend error (your case)
  const errObj = error as any;

  const validationMessage = errObj?.validation?.body?.message;
  const message = errObj?.message;
  const errorField = errObj?.error;

  return (
    validationMessage ||
    message ||
    errorField ||
    "An unexpected error occurred"
  );
}
