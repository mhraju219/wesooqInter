import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Package, ShoppingBag, Users } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') redirect('/auth/login');

  const [totalMerchants, totalProducts, totalOrders, totalUsers] = await Promise.all([
    prisma.business.count({ where: { isActive: true } }),
    prisma.catalogProduct.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count(),
  ]);

  const stats = [
    { title: 'Total Merchants', value: totalMerchants, icon: Store, color: 'text-blue-600' },
    { title: 'Catalog Products', value: totalProducts, icon: Package, color: 'text-green-600' },
    { title: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'text-purple-600' },
    { title: 'Total Users', value: totalUsers, icon: Users, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {session.user.email}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}