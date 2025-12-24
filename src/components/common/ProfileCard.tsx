"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeToken } from '@/utils/auth';
import { logout } from '@/redux/auth/authSlice';
import { useLoader } from '@/context/LoaderContext';
import { toast } from 'react-toastify';
import { LayoutDashboard, Settings, LogOut, Sparkles, MessageCircle } from 'lucide-react';

interface ProfileCardProps {
  onClose?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ onClose }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Chat widget state
  const [chatHidden, setChatHidden] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('chatWidgetDismissed');
    setChatHidden(dismissed === 'true');
  }, []);

  const handleShowChat = () => {
    localStorage.removeItem('chatWidgetDismissed');
    setChatHidden(false);
    toast.success("Chat widget restored!", { autoClose: 2000 });
    onClose?.();
    // Trigger a page reload to show the chat widget
    window.location.reload();
  };

  const profileSrc = user?.avatar
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
    : "/images/icons/User.svg";

  const dashboardLink = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
  const settingsLink = user?.role === 'ADMIN' ? '/admin/setting-support' : '/dashboard/setting-support';

  const menuItems = [
    { id: 1, label: "Dashboard", link: dashboardLink, icon: LayoutDashboard },
    { id: 2, label: "Settings", link: settingsLink, icon: Settings },
  ];

  const handleLogout = async () => {
    showLoader("Logging out...");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Logout failed", error);
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      const role = user?.role;
      removeToken();
      dispatch(logout());
      toast.dismiss();
      toast.success("Logged out successfully!", { autoClose: 2000 });
      hideLoader();

      setTimeout(() => {
        if (role === "ADMIN") router.replace("/admin-login");
        else router.replace("/login");
      }, 200);
    }
  };

  return (
    <div className="w-[320px] bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-2xl border border-gray-100 overflow-hidden ring-1 ring-gray-100 z-50">

      {/* Header Pattern */}
      <div className="h-16 bg-gradient-to-r from-[#204969] to-[#306A64] relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* User Info Section */}
      <div className="px-6 pb-4 -mt-8 relative">
        <div className="flex items-end justify-between">
          <div className="relative group">
            <div className="w-[72px] h-[72px] rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
              <Image
                src={profileSrc}
                width={72}
                height={72}
                alt="profile"
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-100">
              {user?.role || "USER"}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-1">
            {user?.name || "User"}
            {user?.role === 'ADMIN' && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
          </h3>
          <p className="text-sm text-gray-500 font-medium truncate">{user?.email}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-50 mx-6 mb-2" />

      {/* Menu List */}
      <div className="px-3 pb-2 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.link}
              onClick={() => onClose?.()}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group font-medium text-sm"
            >
              <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-[#306A64] group-hover:shadow-sm transition-all">
                <Icon className="w-4 h-4" />
              </div>
              {item.label}
            </Link>
          );
        })}

        {/* Show Chat Option - Only shown when chat is hidden */}
        {chatHidden && (
          <button
            onClick={handleShowChat}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 group font-medium text-sm"
          >
            <div className="p-1.5 rounded-lg bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-[#306A64] group-hover:shadow-sm transition-all">
              <MessageCircle className="w-4 h-4" />
            </div>
            Show Chat
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-50 mx-6 my-1" />

      {/* Logout */}
      <div className="p-3 pt-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group font-medium text-sm"
        >
          <div className="p-1.5 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-all">
            <LogOut className="w-4 h-4" />
          </div>
          Sign Out
        </button>
      </div>

      {/* Footer Branding */}
      <div className="bg-gray-50 py-2 text-center border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-medium">LeadFusion Admin • v1.0.0</p>
      </div>

    </div>
  );
};

export default ProfileCard;

