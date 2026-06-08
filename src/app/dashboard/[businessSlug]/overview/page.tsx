import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, Users, DollarSign } from 'lucide-react';

export default async function OverviewPage({
  params,
}: {
  params: { businessSlug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  // Fetch business by slug
  const business = await prisma.business.findUnique({
    where: { slug: params.businessSlug },
    select: { id: true, name: true },
  });
  if (!business) redirect('/dashboard');

  // Verify ownership (optional but recommended)
  if (session.user.businessSlug !== params.businessSlug && session.user.role !== 'PLATFORM_ADMIN') {
    redirect(`/dashboard/${session.user.businessSlug}/overview`);
  }

  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  const [ordersCount, productsCount] = await Promise.all([
    prisma.order.count({ where: { businessId: business.id } }),
    prisma.product.count({ where: { businessId: business.id, isActive: true } }),
  ]);

  const stats = [
    {
      title: locale === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      value: ordersCount,
      icon: ShoppingBag,
      color: 'text-blue-600',
      change: locale === 'ar' ? '+١٢٪' : '+12%',
    },
    {
      title: locale === 'ar' ? 'المنتجات' : 'Products',
      value: productsCount,
      icon: Package,
      color: 'text-green-600',
      change: locale === 'ar' ? '+٥٪' : '+5%',
    },
    {
      title: locale === 'ar' ? 'الإيرادات' : 'Revenue',
      value: '$0',
      icon: DollarSign,
      color: 'text-yellow-600',
      change: locale === 'ar' ? '+٠٪' : '+0%',
    },
    {
      title: locale === 'ar' ? 'الموظفين' : 'Staff',
      value: '0',
      icon: Users,
      color: 'text-purple-600',
      change: locale === 'ar' ? '+٠٪' : '+0%',
    },
  ];

  const pageTitle = locale === 'ar' ? 'نظرة عامة' : 'Overview';
  const welcomeMessage =
    locale === 'ar'
      ? 'مرحباً بعودتك! إليك نظرة عامة على نشاط متجرك.'
      : 'Welcome back! Here is an overview of your store activity.';
  const recentOrdersTitle = locale === 'ar' ? 'الطلبات الأخيرة' : 'Recent Orders';
  const noOrders = locale === 'ar' ? 'لا توجد طلبات حديثة' : 'No recent orders yet.';
  const quickActionsTitle = locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions';
  const viewAllOrders = locale === 'ar' ? 'عرض جميع الطلبات →' : 'View all orders →';
  const manageProducts = locale === 'ar' ? 'إدارة المنتجات →' : 'Manage products →';
  const manageStaff = locale === 'ar' ? 'إدارة الموظفين →' : 'Manage staff →';
  const fromLastMonth = locale === 'ar' ? 'عن الشهر الماضي' : 'from last month';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground mt-1">{welcomeMessage}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center pt-1">
                <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                <span className="text-xs text-muted-foreground ml-1">{fromLastMonth}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle>{recentOrdersTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{noOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle>{quickActionsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-col gap-3">
              <a
                href={`/dashboard/${params.businessSlug}/orders`}
                className="text-primary hover:underline"
              >
                {viewAllOrders}
              </a>
              <a
                href={`/dashboard/${params.businessSlug}/products`}
                className="text-primary hover:underline"
              >
                {manageProducts}
              </a>
              <a
                href={`/dashboard/${params.businessSlug}/staff`}
                className="text-primary hover:underline"
              >
                {manageStaff}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}