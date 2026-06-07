import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { BusinessCategory } from '@prisma/client';
import { ProductsClient } from '@/components/dashboard/ProductsClient';

function getCatalogProductName(name: any): string {
  if (!name) return 'Product';
  if (typeof name === 'string') return name;
  return name.en || name.ar || 'Product';
}

export default async function ProductsPage({ params }: { params: { businessSlug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const business = await prisma.business.findUnique({
    where: { slug: params.businessSlug },
    select: { id: true, name: true, category: true },
  });
  if (!business) redirect('/dashboard');

  // Ensure user owns this business
  if (session.user.businessSlug !== params.businessSlug && session.user.role !== 'PLATFORM_ADMIN') {
    redirect(`/dashboard/${session.user.businessSlug}`);
  }

  // Only product-based businesses can access this page
// Only product-based businesses can access this page
const productCategories: BusinessCategory[] = [
  BusinessCategory.SUPERMARKET,
  BusinessCategory.RESTAURANT,
  BusinessCategory.ELECTRONICS,
];
if (!productCategories.includes(business.category)) {
  redirect(`/dashboard/${params.businessSlug}/overview?error=products_not_allowed`);
}

  const products = await prisma.product.findMany({
    where: { businessId: business.id, isActive: true },
    include: { catalogProduct: true },
    orderBy: { createdAt: 'desc' },
  });

  const productsForClient = products.map(p => ({
    id: p.id,
    name: p.catalogProduct.name,
    barcode: p.catalogProduct.barcode,
    sku: p.sku,
    price: Number(p.sellingPrice),
    costPrice: Number(p.costPrice),
    stockQuantity: p.stockQuantity,
    availableOnline: p.availableOnline,
    isActive: p.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1">
          Manage your inventory – add, edit, or remove products.
        </p>
      </div>
      <ProductsClient initialProducts={productsForClient} businessId={business.id} />
    </div>
  );
}