import { Metadata } from "next";

import VerifyEmail from '@/components/auth/VerifyEmail/VerifyEmail'


export default function verifyEmail() {
  return (
    <>
    <VerifyEmail />
    </>

  )
}
export const metadata: Metadata = {
  title: 'OTP confirmation | Leadfusion',
  description: 'Reset Password to your account to manage leads and campaigns.'
};
