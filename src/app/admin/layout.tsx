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
    <div className="layout_admin flex ">
      <div className="w-full fixed left-0 top-0">
      <Sidebar />
      </div>
      <div className={`transition-all duration-300   ${collapsed?"ml-[6%] w-[94%]":"ml-[25%] w-[75%]"}`}>
        <MainPanel />
        <main className="px-[24px] py-[24px] bg-gray-100 min-h-screen w-full">{children}</main>
      </div>
    </div>

  );
}
