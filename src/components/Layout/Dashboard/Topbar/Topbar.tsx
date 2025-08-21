'use client';

import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/redux/theme/theme_slice';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppDispatch, RootState } from '@/redux/store';
import Image from 'next/image';
import { adminSidebarItems, userSidebarItems } from '../../Sidebar/sidebarData';
import { SidebarItem } from '@/types/sidebar';
const Topbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  const { user } = useSelector((state: RootState) => state.auth);
  const [title, setTitle] = useState('');

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

  return (
    <div className="bg-white w-full flex items-center gap-[45px] lg:pt-[38px] lg:pb-[43px] pt-[38px] pb-[21px] sm:pb-[44px] pl-[28px] shadow-sm">
      <div className="menue-toggler-wrapper text-black ">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="menu-toggler"
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
  );
};

export default Topbar;
