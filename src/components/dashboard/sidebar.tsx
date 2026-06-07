'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Users,
  Receipt,
  ClipboardList,
  Truck,
  Wallet,
  Settings,
  Store,
  Package,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  businessSlug: string;
  businessId: string;
  role: string;
}

const navigationItems = (businessSlug: string, role: string, locale: string) => {
  const basePath = `/dashboard/${businessSlug}`;
  const items = [
    { href: `${basePath}/overview`, label: locale === 'ar' ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard, roles: ['PLATFORM_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'CASHIER'] },
    { href: `${basePath}/pos`, label: locale === 'ar' ? 'نقطة البيع' : 'POS', icon: Store, roles: ['BUSINESS_OWNER', 'MANAGER', 'CASHIER'] },
    { href: `${basePath}/orders`, label: locale === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingBag, roles: ['BUSINESS_OWNER', 'MANAGER', 'CASHIER'] },
    { href: `${basePath}/products`, label: locale === 'ar' ? 'المنتجات' : 'Products', icon: Package, roles: ['BUSINESS_OWNER', 'MANAGER'] },
    { href: `${basePath}/appointments`, label: locale === 'ar' ? 'المواعيد' : 'Appointments', icon: Calendar, roles: ['BUSINESS_OWNER', 'MANAGER', 'DOCTOR'] },
    { href: `${basePath}/staff`, label: locale === 'ar' ? 'الموظفين' : 'Staff', icon: Users, roles: ['BUSINESS_OWNER', 'MANAGER'] },
    { href: `${basePath}/payroll`, label: locale === 'ar' ? 'الرواتب' : 'Payroll', icon: Receipt, roles: ['BUSINESS_OWNER'] },
    { href: `${basePath}/tasks`, label: locale === 'ar' ? 'المهام' : 'Tasks', icon: ClipboardList, roles: ['BUSINESS_OWNER', 'MANAGER'] },
    { href: `${basePath}/suppliers`, label: locale === 'ar' ? 'الموردين' : 'Suppliers', icon: Truck, roles: ['BUSINESS_OWNER', 'MANAGER'] },
    { href: `${basePath}/accounting`, label: locale === 'ar' ? 'المحاسبة' : 'Accounting', icon: Wallet, roles: ['BUSINESS_OWNER', 'MANAGER'] },
    { href: `${basePath}/settings`, label: locale === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings, roles: ['BUSINESS_OWNER'] },
  ];
  return items.filter(item => item.roles.includes(role));
};

export function DashboardSidebar({ businessSlug, role }: SidebarProps) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { data: session } = useSession();
  const items = navigationItems(businessSlug, role, locale);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-primary">
          {locale === 'ar' ? 'وي سوق' : 'WeSoooq'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {locale === 'ar' ? 'لوحة التحكم' : 'Merchant Portal'}
        </p>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 px-4 py-2.5 h-auto rounded-lg transition-all duration-200',
                  isActive && 'bg-primary/10 text-primary font-medium shadow-sm'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-3 py-2 text-sm text-gray-500 truncate">
          {session?.user?.email}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 mt-2 rounded-lg"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}