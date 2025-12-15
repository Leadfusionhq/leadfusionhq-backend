'use client';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/redux/auth/authSlice';
import { RxCross2 } from "react-icons/rx";
import { removeToken } from '@/utils/auth';
import { toggleSidebar, collapseSidebar } from '@/redux/theme/theme_slice';
// import { usePathname, useRouter } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarItem from './SidebarItem';
import { adminSidebarItems, userSidebarItems } from './sidebarData';
import { AppDispatch, RootState } from '@/redux/store';
import { useLoader } from '@/context/LoaderContext';

const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { collapsed } = useSelector((state: RootState) => state.theme);
  //  console.log("inside collapsed sidebar",collapsed)
  // const pathname = usePathname();

  const { user } = useSelector((state: RootState) => state.auth);
  const { showLoader, hideLoader } = useLoader();
  const role = user?.role;

  const sidebarItems = role === 'ADMIN' ? adminSidebarItems : userSidebarItems;

  const handleLogout = async () => {
    showLoader("Logging out...");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Logout failed", error);
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      // Always clean up and navigate
      removeToken();
      dispatch(logout());
      hideLoader(); // Explicitly hide loader

      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        router.replace("/login");
      }, 50);
    }
  };

  return (
    <aside
      className={`bg-black  fixed z-10 lg:z-10 top-0 left-0   text-white flex flex-col justify-between min-h-screen
    lg:translate-x-0
    transition-all duration-300   ${collapsed ? 'lg:w-[6%] translate-x-0 w-[85%]  ' : "lg:w-[17%]  hidden lg:flex -translate-x-full "} 
  `}
    >
      <button
        className="absolute z-10 right-2 top-2 lg:hidden cursor-pointer"
        onClick={() => dispatch(collapseSidebar(false))} >
        {/* <Image src="/images/icons/close.png" width={20} height={20} alt="cross-icon" 
         className="absolute z-10 right-1 top-6 lg:hidden cursor-pointer"
        
         /> */}
        <RxCross2 />
      </button>

      <div className="logo-container border-b border-[#FFFFFF17]">
        <Image
          src="/images/logo.svg"
          alt="Logo"
          width={80}
          height={80}
          className="mx-auto h-[140px] lg:h-[72px]   transition-all duration-300"
        />
      </div>
      <nav className="sidebar-nav flex-1 px-[18px] py-4 space-y-[30px]">
        {sidebarItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </nav>
      <div className={`logout-container ${collapsed ? "px-[6px]" : "px-[9px]"} py-4`}>
        <button
          className={`w-full flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer transition-all duration-300  bg-transparent text-[#204D9D] font-semibold delay-[1ms] rounded-full py-2 ${collapsed ? "px-4" : "px-4 border border-[#204D9D]"} `}

          onClick={handleLogout}
        >
          {collapsed ?
            <Image src="/images/logout.png" alt="logout-logo" width={100} height={100} className="hidden lg:block transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis mx-auto w-auto h-[16px] my-[5px]" />
            :
            <div className="transition-all duration-300  whitespace-nowrap overflow-hidden text-ellipsis ">Log Out</div>
          }
          <div className="block lg:hidden px-4 border cursor-pointer  py-2 border-[#204D9D] transition-all duration-300  whitespace-nowrap overflow-hidden text-ellipsis rounded-full ">Log Out</div>

        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
