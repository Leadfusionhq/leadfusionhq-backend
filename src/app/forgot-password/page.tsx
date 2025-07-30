import { Metadata } from "next";

import ForgetPasswordForm from '@/components/auth/ForgetPasswordForm/ForgetPassword'


export default function ForgotPassword() {
  return (
    <>
    <ForgetPasswordForm />
    </>

  )
}
export const metadata: Metadata = {
  title: 'Forgot Password | Leadfusion',
  description: 'Forgot Password to your account to manage leads and campaigns.'
};
