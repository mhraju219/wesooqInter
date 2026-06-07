'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter , usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Calendar, User, LogOut } from 'lucide-react';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'CUSTOMER' && status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') return <div>Loading...</div>;
  if (!session || session.user.role !== 'CUSTOMER') return null;

  const navItems = [
    { href: '/customer/orders', label: 'My Orders', icon: Package },
    { href: '/customer/bookings', label: 'My Bookings', icon: Calendar },
    { href: '/customer/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 hidden md:block">
            <div className="sticky top-24 space-y-2">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-red-600"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </aside>
          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}