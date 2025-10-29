// src/components/Breadcrumb/Breadcrumb.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Users, Shield, FileText, Settings, BarChart3, Bell, MessageSquare, Megaphone, Plus } from 'lucide-react';
import { BreadcrumbsProps, BreadcrumbItem, BreadcrumbConfig } from '@/types/breadcrumb';

// Configuration for route labels and icons
const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  // Admin Dashboard Routes
  'admin': { label: 'Admin', icon: Shield },
  'users': { label: 'Manage Users', icon: Users },
  'leads': { label: 'Manage Leads', icon: FileText },
  'faq': { label: 'faq', icon: BarChart3 },
  'setting-support': { label: 'Settings', icon: Settings },
  'analytics': { label: 'Analytics', icon: BarChart3 },
  'chat': { label: 'Messages', icon: MessageSquare },
  'campaigns': { label: 'Campaigns', icon: Megaphone },
  'add': { label: 'Add New', icon: Plus },
  'edit': { label: 'Edit', icon: null },
  'new': { label: 'Create New', icon: Plus },
  'profile': { label: 'My Profile', icon: Users },
  'notifications': { label: 'Notifications', icon: Bell },
  
  // User Dashboard Routes
  'dashboard': { label: 'Dashboard', icon: Home },
};

export default function Breadcrumbs({ customItems = null }: BreadcrumbsProps) {
  const pathname = usePathname();

  // If custom breadcrumb items are provided, use them
  if (customItems) {
    return <BreadcrumbDisplay items={customItems} />;
  }

  // Handle root/home page - don't show breadcrumbs
  if (!pathname || pathname === '/' || pathname === '/admin' || pathname === '/user') {
    return null;
  }

  // Split path into segments
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Determine dashboard type
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute = pathname.startsWith('/dashboard');
  
  // Determine dashboard path
  const dashboardPath = isAdminRoute ? '/admin/dashboard' : '/dashboard';
  const dashboardLabel = isAdminRoute ? 'Admin Dashboard' : 'Dashboard';
  const DashboardIcon = isAdminRoute ? Shield : Home; // ✅ Changed to uppercase

  // If we're exactly on the dashboard page
  if (pathname === dashboardPath) {
    return (
      <nav className="flex items-center space-x-2 px-4 py-3 bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
        <div className="flex items-center gap-1.5">
          <DashboardIcon size={16} className="text-gray-900" /> {/* ✅ Fixed */}
          <span className="text-sm font-semibold text-gray-900">
            {dashboardLabel}
          </span>
        </div>
      </nav>
    );
  }

  // Build breadcrumb items for sub-pages
  const breadcrumbItems: BreadcrumbItem[] = [];
  let cumulativePath = '';

  // Always add dashboard as first item (clickable) for sub-pages
  breadcrumbItems.push({
    href: dashboardPath,
    label: dashboardLabel,
    icon: DashboardIcon, // ✅ Fixed
    isCurrent: false,
  });

  pathSegments.forEach((segment, index) => {
    cumulativePath += `/${segment}`;
    
    // Skip 'admin', 'user', and 'dashboard' segments (already handled above)
    if (segment === 'admin' || segment === 'user' || segment === 'dashboard' || segment === 'user-dashboard') {
      return;
    }

    // Check if this is a UUID/ID (dynamic segment)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || 
                 /^[0-9a-f]{24}$/i.test(segment) || 
                 /^\d+$/.test(segment);

    if (isId) {
      // Get the parent segment to determine what kind of details page this is
      const parentSegment = pathSegments[index - 1];
      let label = 'Details';
      
      if (parentSegment === 'campaigns') label = 'Campaign Details';
      else if (parentSegment === 'users') label = 'User Details';
      else if (parentSegment === 'leads') label = 'Lead Details';
      
      breadcrumbItems.push({
        href: cumulativePath,
        label: label,
        icon: null,
        isCurrent: index === pathSegments.length - 1,
      });
      return;
    }

    // Get config for this segment
    const config = breadcrumbConfig[segment];
    const isLast = index === pathSegments.length - 1;

    breadcrumbItems.push({
      href: cumulativePath,
      label: config?.label || formatSegment(segment),
      icon: config?.icon || null,
      isCurrent: isLast,
    });
  });

  return <BreadcrumbDisplay items={breadcrumbItems} />;
}

// Breadcrumb Display Component
function BreadcrumbDisplay({ 
  items,
}: { 
  items: BreadcrumbItem[];
}) {
  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center flex-wrap gap-2 px-4 py-3 bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
      {items.map((item, index) => {
        const isLast = item.isCurrent;
        const Icon = item.icon;

        return (
          <div key={`${item.href}-${index}`} className="flex items-center">
            {index > 0 && <ChevronRight size={14} className="mx-2 text-gray-400" />}
            
            {isLast ? (
              // Current page - not clickable
              <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                {Icon && <Icon size={16} />}
                {item.label}
              </span>
            ) : (
              // Previous pages - clickable
              <Link 
                href={item.href}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                {Icon && <Icon size={16} />}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Helper function to format segment names
function formatSegment(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
