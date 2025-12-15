"use client";

import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "@/redux/theme/theme_slice";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AppDispatch, RootState } from "@/redux/store";
import Image from "next/image";
import { adminSidebarItems, userSidebarItems } from "../../Sidebar/sidebarData";
import { SidebarItem } from "@/types/sidebar";
import NotificationCard from "@/components/common/NotificationCard";
import ProfileCard from "@/components/common/ProfileCard";
import { Menu, Bell, Search, ChevronDown } from "lucide-react";

const Topbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const [title, setTitle] = useState("");
  const [openNotification, openSetNotification] = useState(false);
  const [openProfile, openSetProfile] = useState(false);

  const role = user?.role ?? "USER";
  const name = user?.name || "User";

  // Refs not strictly needed for click-outside anymore due to Backdrop, but kept for safety
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const profileSrc = user?.avatar
    ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
    : "/images/icons/User.svg";

  const sidebarItems =
    role === "ADMIN"
      ? adminSidebarItems
      : role === "USER"
        ? userSidebarItems
        : [];

  const getTopTitle = (path: string): string => {
    const findTitle = (items: SidebarItem[]): string | null => {
      for (const item of items) {
        if (item.link === path) return item.name;
        if (item.pathCombinations?.includes(path)) return item.name;
        if (item.child) {
          const found = findTitle(item.child);
          if (found) return found;
        }
      }
      return null;
    };
    return findTitle(sidebarItems) || "Dashboard";
  };

  useEffect(() => {
    const currentTitle = getTopTitle(pathname);
    setTitle(currentTitle);
  }, [pathname]);

  const toggleNotificationCard = () => {
    openSetNotification((prev) => !prev);
    openSetProfile(false);
  };

  const toggleProfileCard = () => {
    openSetProfile((prev) => !prev);
    openSetNotification(false);
  };

  const closeAll = () => {
    openSetNotification(false);
    openSetProfile(false);
  };

  return (
    <>
      {/* Click-Blocking Backdrop */}
      {(openNotification || openProfile) && (
        <div
          className="fixed inset-0 z-[90] bg-transparent cursor-default"
          onClick={closeAll}
          aria-hidden="true"
        />
      )}

      {/* Header Container - No filters here to avoid containing block issues for children if we used fixed there */}
      <header className="sticky top-0 z-[100] w-full border-b border-gray-100 transition-all duration-300">

        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md -z-10" />

        <div className="flex h-[72px] items-center justify-between px-6 lg:px-8 gap-4 relative z-10">

          {/* Left: Sidebar Toggler & Title */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-100"
              type="button"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex flex-col justify-center">
              {title === "Dashboard" ? (
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-none">
                    Dashboard
                  </h3>
                  <span className="text-xs text-gray-500 font-medium mt-1">
                    Welcome back, {name.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  {title}
                </h3>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Search Bar */}
            <div className="hidden md:flex items-center relative mr-2 group">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 group-hover:text-gray-600 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-full text-sm text-gray-600 w-48 transition-all focus:w-64 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-50 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="h-8 w-px bg-gray-100 hidden md:block mx-1" />

            {/* Notification */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={toggleNotificationCard}
                className={`p-2.5 rounded-full transition-all duration-200 relative group
                  ${openNotification ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              {openNotification && (
                <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 z-[120] animate-in fade-in slide-in-from-top-2 duration-200">
                  <NotificationCard />
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={toggleProfileCard}
                className={`flex items-center gap-3 p-1.5 pl-2 rounded-full border border-transparent transition-all duration-200
                  ${openProfile ? "bg-gray-50 border-gray-100" : "hover:bg-gray-50 hover:border-gray-100"}`}
              >
                <div className="hidden md:flex flex-col items-end mr-1">
                  <span className="text-sm font-semibold text-gray-700 leading-none">{name}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">{role}</span>
                </div>

                <div className="relative">
                  <Image
                    src={profileSrc}
                    width={32}
                    height={32}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm"
                    unoptimized
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block ${openProfile ? "rotate-180" : ""}`} />
              </button>

              {openProfile && (
                <div className="absolute right-0 top-full mt-1 z-[120] animate-in fade-in slide-in-from-top-2 duration-200">
                  <ProfileCard onClose={() => openSetProfile(false)} />
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
};

export default Topbar;
