"use client";
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { removeToken } from '@/utils/auth';
import { logout } from '@/redux/auth/authSlice';

const ProfileCard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const profileSrc = user?.avatar
  ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
  : "/images/icons/User.svg";


  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const dashboardLink = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  const menuItems = [
    { id: 1, label: "Dashboard", link: dashboardLink },
    { id: 2, label: "Settings", link: "/settings" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      removeToken(); // clear local token first
      router.replace("/login"); // use replace to avoid going "back" to dashboard
  
      // give router a microtask to run before resetting redux
      setTimeout(() => {
        dispatch(logout());
      }, 0);
    }
  };
  

  return (
    <div className="absolute right-10 top-[88px] w-[320px] bg-black shadow-lg rounded-lg pt-4 z-50 transition-all duration-300 text-base font-normal">
      {/* User Info */}
      <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-800">
        <Image
          src={profileSrc}
          width={60}
          height={60}
          alt="profile_image_icon"
          className="w-12 h-12 rounded-full border border-gray-700"

          
        />
        <div>
          {user?.name && <p className="text-white font-medium">{user?.name}</p>}
          {user?.email && <p className="text-white text-sm">{user?.email}</p>}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex flex-col">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.link}
            className="px-4 py-3 text-white hover:bg-gray-700 cursor-pointer border-b border-gray-800"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className=" text-center px-4 py-3 w-full text-white hover:bg-gray-700 cursor-pointer border-t border-gray-800 "
      >
        LOG OUT
      </button>
    </div>
  );
};

export default ProfileCard;
