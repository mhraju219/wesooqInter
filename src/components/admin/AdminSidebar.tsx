'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export function AdminSidebar() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const isRTL = locale === 'ar';

  const navItems = [
    { href: '/admin', label: isRTL ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/merchants', label: isRTL ? 'المتاجر' : 'Merchants', icon: Store },
    { href: '/admin/catalog', label: isRTL ? 'الكتالوج' : 'Catalog', icon: Package },
    { href: '/admin/categories', label: isRTL ? 'الفئات' : 'Categories', icon: FolderTree },
    { href: '/admin/orders', label: isRTL ? 'الطلبات' : 'Orders', icon: ShoppingBag },
    { href: '/admin/users', label: isRTL ? 'المستخدمين' : 'Users', icon: Users },
    { href: '/admin/settings', label: isRTL ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-primary">WeSoooq Admin</h2>
        <p className="text-xs text-gray-500 mt-1">
          {isRTL ? 'إدارة المنصة' : 'Platform Management'}
        </p>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(`${item.href}/`) || pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2 h-auto rounded-lg transition-all',
                  isActive && 'bg-primary/10 text-primary font-medium'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {isRTL ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}