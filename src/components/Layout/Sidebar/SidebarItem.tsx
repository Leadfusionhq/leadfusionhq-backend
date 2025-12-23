import Image from 'next/image';
import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';
import { useSelector, useDispatch } from 'react-redux';
import { collapseSidebar } from '@/redux/theme/theme_slice';

interface SidebarItemProps {
  item: {
    id: string;
    name: string;
    icon: React.ElementType | string;
    link: string;
    category?: string;
  };
}

const SidebarItem: FC<SidebarItemProps> = ({ item }) => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { collapsed } = useSelector((state: RootState) => state.theme);

  const isActive =
    pathname === item.link ||
    (item.link !== '/dashboard' && pathname?.startsWith(item.link + '/'));

  const Icon = item.icon;

  const handleClick = () => {
    if (window.innerWidth < 1024) {
      dispatch(collapseSidebar(false));
    }
  };

  return (
    <Link href={item.link} className="block group" onClick={handleClick}>
      <div
        className={`relative flex items-center gap-3 overflow-hidden 
        ${collapsed ? "justify-start px-4 lg:justify-center lg:px-2" : "px-4"} 
        py-3.5 min-h-[44px] my-1 rounded-xl cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${isActive
            ? 'bg-gradient-to-r from-[#204969] to-[#306A64] text-white shadow-md shadow-[#204969]/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10'}
        `}
      >
        {/* Premium Active Glow (Left Strip) */}
        {!collapsed && isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4facfe] to-[#00f2fe] shadow-[0_0_15px_#00f2fe] rounded-r-full animate-pulse" />
        )}

        <div className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${!isActive && 'group-hover:scale-110'}`}>
          {typeof Icon === 'string' ? (
            <Image
              priority
              unoptimized
              src={Icon}
              alt={item.name}
              width={20}
              height={20}
              className="object-contain"
            />
          ) : (
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          )}
        </div>

        <div className={`whitespace-nowrap overflow-hidden text-ellipsis text-sm font-medium tracking-wide relative z-10 transition-transform duration-300 group-hover:translate-x-1 ${collapsed ? 'lg:hidden' : ''}`}>
          {item.name}
        </div>

        {/* Tooltip for Collapsed State */}
        {collapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap border border-gray-700">
            {item.name}
            {/* Arrow */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
          </div>
        )}

      </div>
    </Link>
  );
};

export default SidebarItem;
