import { prisma } from '@/lib/db/prisma';
import { BusinessCategory } from '@prisma/client';
import { VendorCard } from '@/components/marketplace/VendorCard';
import { CarouselSection } from '@/components/marketplace/CarouselSection';
import type { JsonValue } from '@prisma/client/runtime/library';

// Helper to extract name from JSON
function getDisplayName(name: JsonValue | null): string {
  if (!name) return 'Business';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const obj = name as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.ar === 'string') return obj.ar;
    const first = Object.values(obj).find(v => typeof v === 'string');
    if (first) return first as string;
  }
  return 'Business';
}

async function getBusinessesWithFeaturedItems() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      logo: true,
      coverImage: true,
      contactPhone: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const businessesWithFeatured = await Promise.all(
    businesses.map(async (business) => {
      if (
        business.category === BusinessCategory.SUPERMARKET ||
        business.category === BusinessCategory.RESTAURANT ||
        business.category === BusinessCategory.ELECTRONICS
      ) {
        // Fetch featured products via inventory (Product) + catalogProduct
        const inventoryItems = await prisma.product.findMany({
          where: { businessId: business.id, isActive: true, availableOnline: true },
          select: {
            id: true,
            sellingPrice: true,
            stockQuantity: true,
            catalogProduct: {
              select: { name: true, images: true, barcode: true }
            }
          },
          take: 3,
          orderBy: { createdAt: 'desc' },
        });

        const featuredProducts = inventoryItems.map(item => ({
          id: item.id,
          name: item.catalogProduct.name,
          price: Number(item.sellingPrice),
          images: item.catalogProduct.images,
        }));
        return { ...business, featuredProducts, featuredServices: [] };
      } else if (business.category === BusinessCategory.HOSPITAL) {
        const featuredServices = await prisma.service.findMany({
          where: { businessId: business.id, isActive: true },
          select: { id: true, name: true, price: true, durationMins: true },
          take: 3,
          orderBy: { createdAt: 'desc' },
        });
        const servicesWithNames = featuredServices.map(s => ({
          ...s,
          name: getDisplayName(s.name),
          price: Number(s.price),
        }));
        return { ...business, featuredProducts: [], featuredServices: servicesWithNames };
      }
      return { ...business, featuredProducts: [], featuredServices: [] };
    })
  );

  return {
    [BusinessCategory.HOSPITAL]: businessesWithFeatured.filter(b => b.category === BusinessCategory.HOSPITAL),
    [BusinessCategory.SUPERMARKET]: businessesWithFeatured.filter(b => b.category === BusinessCategory.SUPERMARKET),
    [BusinessCategory.RESTAURANT]: businessesWithFeatured.filter(b => b.category === BusinessCategory.RESTAURANT),
    [BusinessCategory.ELECTRONICS]: businessesWithFeatured.filter(b => b.category === BusinessCategory.ELECTRONICS),
  };
}

export default async function HomePage() {
  const grouped = await getBusinessesWithFeaturedItems();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <section className="relative bg-primary text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">WeSoooq</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
            Your hyperlocal marketplace – shops, hospitals, restaurants & electronics
          </p>
        </div>
      </section>

      <div className="container mx-auto py-12 space-y-16">
        <CarouselSection title="Hospitals & Clinics" businesses={grouped.HOSPITAL} variant="hospital" />
        <CarouselSection title="Supermarkets" businesses={grouped.SUPERMARKET} variant="supermarket" />
        <CarouselSection title="Restaurants" businesses={grouped.RESTAURANT} variant="restaurant" />
        <CarouselSection title="Electronics Shops" businesses={grouped.ELECTRONICS} variant="electronics" />
      </div>
    </div>
  );
}