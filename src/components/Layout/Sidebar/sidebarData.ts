import { SidebarItem } from '@/types/sidebar';
import { FiMapPin } from 'react-icons/fi';

export const adminSidebarItems: SidebarItem[] = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: '/images/icons/dashboard.svg', 
    link: '/admin/dashboard' 
  },
  {
    id: 'user-management',
    name: 'User Management',
    icon: '/images/icons/user-management.svg',
    link: '/admin/user-management',
    pathCombinations: [
      '/admin/user-management',
      '/admin/user-management/new',
    ]
  },
  {
    id: 'locations',
    name: 'Locations',
    icon: FiMapPin,
    link: '/admin/locations',
    pathCombinations: [
      '/admin/locations/edit',
      '/admin/locations/add',
    ]
  },

];

export const userSidebarItems: SidebarItem[] = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: '/images/icons/dashboard.svg', 
    link: '/dashboard' 
  },
  { 
    id: 'campaigns', 
    name: 'Campaigns', 
    icon: '/images/icons/campaigns.svg', 
    link: '/campaigns' 
  },
];
