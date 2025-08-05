'use client'

// import { Metadata } from "next";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export default function AdminDashboard() {
  // Extracting the user state from the Redux store
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  return (
    <div>
      <h1>Admin Dashboard {user?.name || 'Guest'}</h1>
      <p>Welcome to the Admin dashboard!</p>
    </div>
  );
}

// export const metadata: Metadata = {
//   title: 'Admin Dashboard | Lead Management Platform',
//   description: 'Admin Dashboard where you manage all your leads and settings.'
// };
