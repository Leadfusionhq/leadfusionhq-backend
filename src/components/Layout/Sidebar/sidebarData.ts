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
    icon: '/images/icons/location.svg',
    link: '/admin/locations',
    pathCombinations: [
      '/admin/locations/edit',
      '/admin/locations/add',
    ]
  },
  {
    id: 'campaigns',
    name: 'Campaigns',
    icon: '/images/icons/campaigns.svg',
    link: '/admin/campaigns',
    pathCombinations: [
      '/admin/campaigns/edit',
      '/admin/campaigns/add',
    ]
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: '/images/icons/lead-management.svg',
    link: '/admin/leads',
    pathCombinations: [
      '/admin/leads/edit',
      '/admin/leads/add',
    ]
  },
  {
    id: 'setting-support',
    name: 'Setting & Supports',
    icon: '/images/icons/setting.svg',
    link: '/admin/setting-support',
    // pathCombinations: [
    //   '/admin/leads/edit',
    //   '/admin/leads/add',
    // ]
  },
  {
    id: 'faq',
    name: 'FAQs',
    icon: '/images/icons/chats.svg',
    link: '/admin/faq',
  },
  {

    id: 'chats',
    name: 'Chats',
    icon: '/images/icons/chats.svg',
    link: '/admin/chats',
  },
  // {
  //   id: 'feedback',
  //   name: 'Feedback',
  //   icon: '/images/icons/feedback.svg',
  //   link: '/admin/feedback',

  // },
  {
    id: 'upload-csv',
    name: 'Upload CSV',
    icon: '/images/icons/feedback.svg',
    link: '/admin/upload-csv',

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
    link: '/dashboard/campaigns' 
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: '/images/icons/lead-management.svg',
    link: '/dashboard/leads',
    pathCombinations: [
      '/dashboard/leads/edit',
      '/dashboard/leads/add',
    ]
  },
  {

    id: 'chats',
    name: 'Chats',
    icon: '/images/icons/chats.svg',
    link: '/dashboard/chats',
  },
  {

    id: 'faq',
    name: 'FAQs',
    icon: '/images/icons/chats.svg',
    link: '/dashboard/faq',
  },


  // {
  //   id: 'feedback',
  //   name: 'Feedback',
  //   icon: '/images/icons/feedback.svg',
  //   link: '/dashboard/feedback',
  // },


];
