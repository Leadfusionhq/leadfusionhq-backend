import { Metadata } from "next";

import LoginForm from '@/components/auth/LoginForm/LoginForm'


export default function Login() {
  return (
    <>
    <LoginForm />
    </>

  )
}
export const metadata: Metadata = {
  title: 'Admin Login | Lead Management Platform',
  description: 'Admin Login to your account to manage leads and campaigns.'
};
