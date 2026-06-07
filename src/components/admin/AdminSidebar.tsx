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
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export function AdminSidebar() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  const navItems = [
    { href: '/admin', label: locale === 'ar' ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/merchants', label: locale === 'ar' ? 'المتاجر' : 'Merchants', icon: Store },
    { href: '/admin/catalog', label: locale === 'ar' ? 'الكتالوج' : 'Catalog', icon: Package },
    { href: '/admin/orders', label: locale === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingBag },
    { href: '/admin/users', label: locale === 'ar' ? 'المستخدمين' : 'Users', icon: Users },
    { href: '/admin/settings', label: locale === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary">WeSoooq Admin</h2>
        <p className="text-xs text-gray-500 mt-1">Platform Management</p>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          // Active logic: Dashboard only when exactly '/admin', others when path starts with href
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
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-5 w-5" />
          {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </div>
    </aside>
  );
}