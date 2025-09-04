import { Metadata } from "next";
import { Suspense } from "react";
import VerifyOtpForm from '@/components/auth/VerifyOtp/VerifyOtpForm'


export default function ForgotPassword() {
  return (
    <>
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyOtpForm />
        </Suspense>
    </>

  )
}
export const metadata: Metadata = {
  title: 'OTP confirmation | Leadfusion',
  description: 'Reset Password to your account to manage leads and campaigns.'
};
