import Image from 'next/image';
import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';

interface SidebarItemProps {
  item: {
    id: string;
    name: string;
    icon: React.ElementType | string;
    link: string;
  };
}

const SidebarItem: FC<SidebarItemProps> = ({ item }) => {
  const pathname = usePathname();
  const { collapsed}=useSelector((state:RootState)=>state.theme)
  const isActive =
    pathname === item.link ||
    (item.link !== '/dashboard' && pathname?.startsWith(item.link + '/'));

  return (
    <Link href={item.link}>
      <div
        className={`flex items-center gap-3 px-4 py-2 my-2 rounded-full cursor-pointer ${
          isActive ? 'bg-[#204D9D] text-white ' : 'hover:bg-gray-700'
        }`}
      >
        {typeof item.icon === 'string' ? (
          <Image
            src={item.icon}
            alt={item.name}
            width={23}
            height={24}
            className="object-contain"
          />
        ) : (
          <item.icon size={25} />
        )}
        <span>{item.name}</span>
      </div>
    </Link>
  );
};

export default SidebarItem;
