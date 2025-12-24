'use client';

import { ReactNode, useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import Sidebar from '@/components/Layout/Sidebar/Sidebar';
import MainPanel from '@/components/Layout/Dashboard/MainPanel/MainPanel';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';
import Breadcrumbs from '@/components/Breadcrumb/Breadcrumb';

export default function UserLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { collapsed } = useSelector((state: RootState) => state.theme);
  const { setUserId, connected } = useSocket();

  useEffect(() => {
    // console.warn('user',user)
    if (!isLoggedIn || !user || user.role !== 'USER') {
      router.push('/login');
    }
  }, [isLoggedIn, user, router]);

  // Initialize socket with user ID when user is available
  useEffect(() => {
    if (user && user._id) {
      // console.log('Initializing socket for USER:', user._id);
      setUserId(user._id);
    }
  }, [user, setUserId]);

  return (
    <div className="layout_user flex">
      <Sidebar />
      <div className={` relative transition-all duration-300   z-9 lg:z-9  w-full  ${collapsed ? "lg:ml-[110px] lg:w-[calc(100%-110px)]" : "lg:ml-[260px] lg:w-[calc(100%-260px)]"}`}>

        <MainPanel />
        <main className="px-[24px] py-[24px] bg-gray-100 min-h-screen w-full">
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            !connected && (
              <div className="fixed top-20 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded z-50">
                Socket Disconnected 🔴 | User ID: {user?._id || 'None'}
              </div>
            )
          )}

          <Breadcrumbs />
          {children}
        </main>
        {/* Floating Chat Widget */}
        <FloatingChatWidget />
      </div>
    </div>
  );
}