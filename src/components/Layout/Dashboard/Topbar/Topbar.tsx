'use client';

import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/redux/theme/theme_slice';
import { usePathname } from 'next/navigation';
import { useEffect, useState , useRef} from 'react';
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
    const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const profileSrc = user?.avatar
  ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${user.avatar}`
  : "/images/icons/User.svg";


  const sidebarItems =
    role === 'ADMIN'
      ? adminSidebarItems
      : role === 'USER'
      ? userSidebarItems
      : [];

       useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        openSetNotification(false);
        openSetProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  
    <div className={`bg-white transition-all py-[10px] gap-[20px] lg:py-0 h-auto lg:h-[73px] duration-300 justify-between w-full flex items-center lg:gap-[45px] px-[30px] shadow-sm`}>
      <div className="flex gap-[20px] lg:gap-[45px] items-center">
            
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="menu-toggler cursor-pointer"
          type="button"
        >
          <Image
            src="/images/icons/collapse.svg"
            alt="collapse icon"
             className="min-w-[25px] max-w-[25px] object-fit min-h-[25px] max-h-[25px]"
            width={20}
            height={20}
          />
        </button>
     

      <div className="top-nav-title  text-[14px] lg:text-[14px]">
        {title === 'Dashboard' ? (
          <h3 className="sub-title">
            Welcome to Dashboard, <strong>{name}</strong>
          </h3>
        ) : (
          <h3 className="main-title">{title}</h3>
        )}
      </div>
      </div>
   <div className="flex  gap-[10px] lg:gap-[26px]  items-center cursor-pointer">
    <div ref={notificationRef}>
    <Image 
    src="/images/bell (1).png" width={20} height={20} alt="notification_icon"    className="min-w-[25px] max-w-[25px] object-fit min-h-[25px] max-h-[25px]"
    
    onClick={toggleNotificationCard}
    />
      {/* Notification Card */}
   {openNotification && <NotificationCard/>}
    </div>
    <div ref={profileRef}>
    {/* <Image src="/images/icons/User.svg" width={20} height={20} alt="profile_image_icon" 
     className="min-w-[30px] max-w-[25px] object-fit min-h-[30px] max-h-[25px]"
    
    onClick={toggleProfileCard}
    /> */}
    {/* <Image
      src={profileSrc}
      width={30}
      height={30}
      alt="profile_image_icon"
       className="w-[30px] h-[30px] rounded-full object-cover cursor-pointer"
      onClick={toggleProfileCard}
    /> */}
     

        {openProfile &&<ProfileCard/>} 
    </div>
  
   </div>
 
 
    </div>
    </div>
  );
};

export default Topbar;
