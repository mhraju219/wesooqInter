import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { MerchantApprovalList } from '@/components/admin/MerchantApprovalList';

export default async function AdminMerchantsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    redirect('/auth/login');
  }

  const pendingMerchants = await prisma.user.findMany({
    where: {
      role: 'BUSINESS_OWNER',
      isActive: false,
    },
    include: {
      business: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const approvedMerchants = await prisma.user.findMany({
    where: {
      role: 'BUSINESS_OWNER',
      isActive: true,
    },
    include: {
      business: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Merchant Approvals</h1>
      <MerchantApprovalList pending={pendingMerchants} approved={approvedMerchants} />
    </div>
  );
}