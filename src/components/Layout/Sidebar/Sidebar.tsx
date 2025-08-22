'use client';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/redux/auth/authSlice';
import { removeToken } from '@/utils/auth';

// import { usePathname, useRouter } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarItem from './SidebarItem';
import { adminSidebarItems, userSidebarItems } from './sidebarData';
import { AppDispatch, RootState } from '@/redux/store';
const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { collapsed}=useSelector((state:RootState)=>state.theme);
  // const pathname = usePathname();

  const { user } = useSelector((state: RootState) => state.auth);
 
  const role = user?.role;

  const sidebarItems = role === 'ADMIN' ? adminSidebarItems : userSidebarItems;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      dispatch(logout());
      removeToken();
      router.push('/login');
    }
  };

  return (
<aside
  className={`bg-black text-white h-screen fixed left-0 top-0 flex flex-col justify-between 
    transition-all duration-300
    ${!collapsed ? 'w-[100px] overflow-hidden' : 'w-64'}
  `}
>      <div className="logo-container p-[24px] sm:p-[12px] border-b border-white/20">
        <Image
          src="/images/logo.svg"
          alt="Logo"
          width={80}
          height={80}
          className="mx-auto h-[76px]   transition-all duration-300"
        />
      </div>
      <nav className="sidebar-nav flex-1 px-[18px] py-4 space-y-4">
        {sidebarItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </nav>
      <div className="logout-container px-6 py-4">
        <button
          className="w-full overflow-hidden cursor-pointer transition-all duration-300  bg-transparent text-[#204D9D] font-semibold delay-[1ms] rounded-full py-2 px-4 border border-[#204D9D]"

          onClick={handleLogout}
        >
         {!collapsed ?<Image src="/images/logout.png" alt="logout-logo" width={100} height={100} className="transition-all duration-300 delay-[1ms] w-auto h-[16px] my-[5px]"/>:  
         <span className="transition-all duration-300 delay-[1ms] whitespace-nowrap ">Log Out</span>
} 
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
