'use client';

import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/redux/theme/theme_slice';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppDispatch, RootState } from '@/redux/store';
import Image from 'next/image';
import { adminSidebarItems, userSidebarItems } from '../../Sidebar/sidebarData';
import { SidebarItem } from '@/types/sidebar';
import NotificationCard from '@/components/common/NotificationCard';
import ProfileCard from '@/components/common/ProfileCard';

const Topbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
 const { collapsed}=useSelector((state:RootState)=>state.theme)
  const { user } = useSelector((state: RootState) => state.auth);
  const [title, setTitle] = useState('');
 const [openNotification,openSetNotification]=useState(false);
  const [openProfile,openSetProfile]=useState(false);
  const role = user?.role ?? 'USER';
  const name = user?.name || 'USER';

  const sidebarItems =
    role === 'ADMIN'
      ? adminSidebarItems
      : role === 'USER'
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

    return findTitle(sidebarItems) || 'Dashboard';
    };

  useEffect(() => {
    const currentTitle = getTopTitle(pathname);
    setTitle(currentTitle);
  }, [pathname]);

  const toggleNotificationCard=()=>{
    openSetNotification((prev)=>!prev);
     openSetProfile(false);
  }
 const toggleProfileCard=()=>{
    openSetProfile((prev)=>!prev);
      openSetNotification(false);
  }
  return (
    <div>
  
    <div className={`bg-white transition-all h-[102px] lg:h-[101px] ${collapsed?"xl:h-[105px]":"xl:h-[101px]"}  duration-300 justify-between w-full flex items-center gap-[45px] lg:pt-[38px] ${!collapsed?" lg:pb-[39px] ":" lg:pb-[43px] "} pt-[38px] pb-[21px] sm:pb-[44px] pl-[28px] shadow-sm`}>
      <div className="flex gap-[45px]">
              <div className="menue-toggler-wrapper text-black ">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="menu-toggler cursor-pointer"
          type="button"
        >
          <Image
            src="/images/icons/collapse.svg"
            alt="collapse icon"
            width={20}
            height={20}
          />
        </button>
      </div>

      <div className="top-nav-title">
        {title === 'Dashboard' ? (
          <h3 className="sub-title">
            Welcome to Dashboard, <strong>{name}</strong>
          </h3>
        ) : (
          <h3 className="main-title">{title}</h3>
        )}
      </div>
      </div>
   <div className="pr-[28px] flex  gap-[20px]  items-center cursor-pointer">
    <Image 
    src="/images/group_notification.png" width={16} height={20} alt="notification_icon" 
    
    onClick={toggleNotificationCard}
    />
    <Image src="/images/icons/User.svg" width={20} height={20} alt="profile_image_icon"  onClick={toggleProfileCard}/>
   </div>
   {/* Notification Card */}
   {openNotification && <NotificationCard/>}
   {openProfile &&<ProfileCard/>} 
    </div>
    </div>
  );
};

export default Topbar;
