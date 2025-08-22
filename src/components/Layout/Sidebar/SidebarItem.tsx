import Image from 'next/image';
import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';
import {useSelector} from 'react-redux'
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
  const { collapsed}=useSelector((state:RootState)=>state.theme);
  console.log("inside collapsed",collapsed);
  const isActive =
    pathname === item.link ||
    (item.link !== '/dashboard' && pathname?.startsWith(item.link + '/'));

  return (
    <Link href={item.link}>
    <div
  className={`flex items-center ${collapsed?"justify-left":""} gap-3 overflow-hidden  ${collapsed?"px-[6px]":"px-[20px]"} py-[8px]  my-[8px] rounded-full cursor-pointer transition-all duration-300 
    ${isActive ? 'bg-[#204D9D] text-white' : 'hover:bg-gray-700'}
  `}
>
        {typeof item.icon === 'string' ? (
          <Image
          priority
          unoptimized 
            src={item.icon}
            alt={item.name}
            width={23}
            height={24}
            className={`object-contain ${collapsed?"mx-auto":""} `}
          />
        ) : (
          <item.icon size={25} />
        )}
        {!collapsed &&    <div className="whitespace-nowrap overflow-hidden text-ellipsis ">

          {item.name}</div>}
       
      </div>
    </Link>
  );
};

export default SidebarItem;
