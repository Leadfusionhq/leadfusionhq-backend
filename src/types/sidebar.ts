import { IconType } from 'react-icons';

export type SidebarItem = {
  id: string;
  name: string;
  icon: string | IconType;
  link: string;
  pathCombinations?: string[];
  child?: SidebarItem[];
  category?: string;
};
