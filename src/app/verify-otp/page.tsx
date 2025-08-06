import { Metadata } from "next";

import VerifyOtpForm from '@/components/auth/VerifyOtp/VerifyOtpForm'


export default function ForgotPassword() {
  return (
    <>
    <VerifyOtpForm />
    </>

  )
}
export const metadata: Metadata = {
  title: 'OTP confirmation | Leadfusion',
  description: 'Reset Password to your account to manage leads and campaigns.'
};
