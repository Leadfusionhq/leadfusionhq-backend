import { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from '@/components/auth/ResetPassword/ResetPasswordForm'


export default function ForgotPassword() {
  return (
    <>
    <Suspense fallback={<div>Loading...</div>}>
    <ResetPasswordForm />
    </Suspense>
    </>

  )
}
export const metadata: Metadata = {
  title: 'Reset Password | Leadfusion',
  description: 'Reset Password to your account to manage leads and campaigns.'
};
