import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CatalogManager } from '@/components/admin/CatalogManager';

export default async function AdminCatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    redirect('/auth/login');
  }

  // Fetch initial catalog products
  const products = await prisma.catalogProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Transform for client: include all required fields
  const productsForClient = products.map(p => ({
    id: p.id,
    barcode: p.barcode,
    name: typeof p.name === 'object' ? p.name : { en: p.name, ar: '' },
    description: p.description || {},
    category: p.category,
    images: p.images || [],       // ✅ added
    isActive: p.isActive,         // ✅ added
  }));

  return <CatalogManager initialProducts={productsForClient} />;
}