
import { SidebarItem } from '@/types/sidebar';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Target,
  Settings,
  MessageCircleQuestion,
  MessageSquare,
  Upload,
  FileText,
  Search,
  Rocket,
  CreditCard
} from 'lucide-react';

export const adminSidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    link: '/admin/dashboard',
    category: 'Main'
  },
  {
    id: 'user-management',
    name: 'User Management',
    icon: Users,
    link: '/admin/user-management',
    pathCombinations: [
      '/admin/user-management',
      '/admin/user-management/new',
    ],
    category: 'Management'
  },
  {
    id: 'campaigns',
    name: 'Campaigns',
    icon: Megaphone,
    link: '/admin/campaigns',
    pathCombinations: [
      '/admin/campaigns/edit',
      '/admin/campaigns/add',
    ],
    category: 'Management'
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: Target,
    link: '/admin/leads',
    pathCombinations: [
      '/admin/leads/edit',
      '/admin/leads/add',
    ],
    category: 'Management'
  },

  {
    id: 'chats',
    name: 'Chats',
    icon: MessageSquare,
    link: '/admin/chats',
    category: 'Communication'
  },
  {
    id: 'faq',
    name: 'FAQs',
    icon: MessageCircleQuestion,
    link: '/admin/faq',
    category: 'Communication'
  },
  {
    id: 'setting-support',
    name: 'Setting & Supports',
    icon: Settings,
    link: '/admin/setting-support',
    category: 'System'
  },
  {
    id: 'upload-csv',
    name: 'Upload CSV',
    icon: Upload,
    link: '/import-csv',
    category: 'Tools'
  },
  {
    id: 'csv-logs',
    name: 'CSV Logs',
    icon: FileText,
    link: '/admin/logs/csv',
    category: 'Tools'
  },

  {
    id: 'search',
    name: 'Search',
    icon: Search,
    link: '/search',
    category: 'System'
  },
  {
    id: 'supacampaign',
    name: 'SupaCampaign',
    icon: Rocket,
    link: '/supacampaign',
    category: 'Tools'
  },
];

export const userSidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    link: '/dashboard',
    category: 'Main'
  },
  {
    id: 'campaigns',
    name: 'Campaigns',
    icon: Megaphone,
    link: '/dashboard/campaigns'
  },
  {
    id: 'leads',
    name: 'Leads',
    icon: Target,
    link: '/dashboard/leads',
    pathCombinations: [
      '/dashboard/leads/edit',
      '/dashboard/leads/add',
    ]
  },
  {
    id: 'chats',
    name: 'Chats',
    icon: MessageSquare,
    link: '/dashboard/chats',
  },
  {
    id: 'setting-support',
    name: 'Setting & Supports',
    icon: Settings,
    link: '/dashboard/setting-support',
  },
  {
    id: 'faq',
    name: 'FAQs',
    icon: MessageCircleQuestion,
    link: '/dashboard/faq',
  },
  {
    id: 'billing-control',
    name: 'Billing Control',
    icon: CreditCard,
    link: '/dashboard/billing-control',
  },
];
