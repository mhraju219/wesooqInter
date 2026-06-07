import { prisma } from '@/lib/db/prisma';
import { BusinessCategory } from '@prisma/client';
import { notFound } from 'next/navigation';
import { ProductCatalog } from '@/components/marketplace/ProductCatalog';
import { BookingEngine } from '@/components/booking/BookingEngine';
import type { JsonValue } from '@prisma/client/runtime/library';

function getBusinessName(name: JsonValue | null): string {
  if (!name) return 'Business';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') {
    const obj = name as Record<string, unknown>;
    return (obj.en as string) || (obj.ar as string) || 'Business';
  }
  return 'Business';
}

async function getBusiness(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        where: { isActive: true, availableOnline: true, stockQuantity: { gt: 0 } },
        include: {
          catalogProduct: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      services: {
        where: { isActive: true },
      },
    },
  });
  return business;
}

export default async function StorefrontPage({ params }: { params: { businessSlug: string } }) {
  const business = await getBusiness(params.businessSlug);
  if (!business) notFound();

  const isProductBusiness =
    business.category === BusinessCategory.SUPERMARKET ||
    business.category === BusinessCategory.RESTAURANT ||
    business.category === BusinessCategory.ELECTRONICS;

  // Keep the product name as the full JSON object – localization happens in ProductCatalog
  const productsForCatalog = business.products.map((product) => ({
    id: product.id,
    name: product.catalogProduct.name,
    price: Number(product.sellingPrice),
    stockQuantity: product.stockQuantity,
    images: product.catalogProduct.images,
  }));

  const businessName = getBusinessName(business.name);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">{businessName}</h1>
          {business.contactPhone && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              📞 {business.contactPhone}
            </p>
          )}
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {isProductBusiness ? (
          <ProductCatalog products={productsForCatalog} businessId={business.id} />
        ) : (
          <BookingEngine businessId={business.id} services={business.services} />
        )}
      </div>
    </div>
  );
}