'use client';

import { ReactNode, useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
// import Header from '@/components/Layout/Header/Header';
import Sidebar from '@/components/Layout/Sidebar/Sidebar';
import MainPanel from '@/components/Layout/Dashboard/MainPanel/MainPanel';

export default function UserLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter()
  const { collapsed}=useSelector((state:RootState)=>state.theme);


  useEffect(() => {
      if (!isLoggedIn ||!user || user.role !== 'USER') router.push('/login');
  });
  return (
    <div className="layout_user flex">
      <Sidebar />
      <div className={` relative transition-all duration-300   z-9 lg:z-9  w-full  ${collapsed?"lg:ml-[6%] lg:w-[94%]":"lg:ml-[21%] lg:w-[79%]"}`}>
        <MainPanel />
        <main className="px-[24px] py-[24px] bg-gray-100 min-h-screen w-full">{children}</main>
      </div>
    </div>
  );
}
