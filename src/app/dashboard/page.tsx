import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true, role: true },
  });

  if (user?.businessId) {
    redirect(`/dashboard/${user.businessId}/overview`);
  } else if (user?.role === 'PLATFORM_ADMIN') {
    redirect('/admin/merchants');
  } else {
    redirect('/auth/no-business');
  }
}