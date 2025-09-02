'use client';

import { ReactNode, useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import MainPanel from '@/components/Layout/Dashboard/MainPanel/MainPanel';
import Sidebar from '@/components/Layout/Sidebar/Sidebar';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget'; 

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { collapsed } = useSelector((state: RootState) => state.theme);
  const { setUserId, connected } = useSocket();

  useEffect(() => {
    if (!isLoggedIn || !user || user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isLoggedIn, user, router]);

  // Initialize socket with user ID when user is available
  useEffect(() => {
    if (user && user._id) {
      console.log('Initializing socket for ADMIN:', user._id);
      setUserId(user._id);
    }
  }, [user, setUserId]);

  return (
    <div className="layout_admin flex ">
      <div className={``}>
        <Sidebar />
      </div>
      <div className={` relative transition-all duration-300   z-9 lg:z-9  w-full  ${collapsed?"lg:ml-[6%] lg:w-[94%]":"lg:ml-[17%] lg:w-[83%]"}`}>
        <MainPanel />
        <main className="px-[24px] py-[24px] bg-gray-100 w-full min-h-[calc(100vh-97px)] pb-0">
        {/* <AdminChatWidget /> */}
          {/* Debug info - remove in production */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-20 right-4 bg-black text-white text-xs px-2 py-1 rounded z-50">
              Socket: {connected ? '🟢' : '🔴'} | User ID: {user?._id || 'None'}
            </div>
          )} */}
          {children}
        </main>
          
          {/* Floating Chat Widget */}
          <FloatingChatWidget />

      </div>
    </div>
  );
}