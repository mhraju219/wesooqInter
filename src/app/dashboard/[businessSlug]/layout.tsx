import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { businessSlug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  // Find business by slug
  const business = await prisma.business.findUnique({
    where: { slug: params.businessSlug },
    select: { id: true, name: true, slug: true, logo: true },
  });
  if (!business) redirect('/dashboard');

  const userBusinessSlug = session.user.businessSlug;
  const isPlatformAdmin = session.user.role === 'PLATFORM_ADMIN';
  if (!isPlatformAdmin && userBusinessSlug !== params.businessSlug) {
    redirect(`/dashboard/${userBusinessSlug}`);
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900">
      <DashboardSidebar businessSlug={params.businessSlug} businessId={business.id} role={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader business={business} user={session.user} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}