'use client';

import { ReactNode, useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
// import Header from '@/components/Layout/Header/Header';
import MainPanel from '@/components/Layout/Dashboard/MainPanel/MainPanel';
import Sidebar from '@/components/Layout/Sidebar/Sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { collapsed}=useSelector((state:RootState)=>state.theme);


    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'ADMIN') router.push('/login');
    });

  return (
    <div className="layout_admin flex">
      <Sidebar />
      <div className={`transition-all duration-300  flex-1 ${collapsed?"ml-64":"ml-[103px]"}`}>
        <MainPanel />
        <main className="p-6 bg-gray-100 min-h-screen">{children}</main>
      </div>
    </div>

  );
}
