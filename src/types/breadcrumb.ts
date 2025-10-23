// types/breadcrumb.ts
import { LucideIcon } from 'lucide-react';

export interface BreadcrumbItem {
  href: string;
  label: string;
  icon?: LucideIcon | null;
  isCurrent?: boolean;
}

export interface BreadcrumbConfig {
  label: string;
  icon?: LucideIcon | null;
}

export interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[] | null;
}

export interface BreadcrumbDisplayProps {
  items: BreadcrumbItem[];
}