import { Metadata } from "next";

import ResetPasswordForm from '@/components/auth/ResetPassword/ResetPasswordForm'


export default function ForgotPassword() {
  return (
    <>
    <ResetPasswordForm />
    </>

  )
}
export const metadata: Metadata = {
  title: 'Reset Password | Leadfusion',
  description: 'Reset Password to your account to manage leads and campaigns.'
};
