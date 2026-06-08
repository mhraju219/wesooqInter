import { prisma } from '@/lib/db/prisma';
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

// Helper to extract category name
function getCategoryName(name: JsonValue | null): string {
  if (!name) return 'Other';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const obj = name as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.ar === 'string') return obj.ar;
    const first = Object.values(obj).find(v => typeof v === 'string');
    if (first) return first as string;
  }
  return 'Other';
}

async function getBusinessesWithFeaturedItems() {
  // Fetch all active businesses with their category and inventory products (for product-based businesses)
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    include: {
      businessCategory: true,
      products: {
        where: { isActive: true, availableOnline: true, stockQuantity: { gt: 0 } },
        include: {
          catalogProduct: true,
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
      services: {
        where: { isActive: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // For each business, shape featuredProducts and featuredServices
  const businessesWithFeatured = businesses.map((business) => {
    let featuredProducts: any[] = [];
    let featuredServices: any[] = [];
    // Assume hospital slugs are 'hospital' or any category that is service-only. We can also detect by existence of services or products.
    // For simplicity, we treat businesses that have services (and not products) as service providers. But better: check category slug.
    const isServiceProvider = business.businessCategory?.slug === 'hospital'; // adjust as needed
    if (!isServiceProvider) {
      featuredProducts = business.products.map(p => ({
        id: p.id,
        name: p.catalogProduct.name,
        price: Number(p.sellingPrice),
        images: p.catalogProduct.images,
      }));
    } else {
      featuredServices = business.services.map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        durationMins: s.durationMins,
      }));
    }
    return {
      ...business,
      featuredProducts,
      featuredServices,
    };
  });

  // Group by businessCategoryId
  const grouped: Record<string, any[]> = {};
  for (const business of businessesWithFeatured) {
    const catId = business.businessCategoryId;
    if (!grouped[catId]) grouped[catId] = [];
    grouped[catId].push(business);
  }
  // Fetch all active business categories
  const categories = await prisma.businessCategory.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  return { grouped, categories };
}

export default async function HomePage() {
  const { grouped, categories } = await getBusinessesWithFeaturedItems();

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
        {categories.map(category => {
          const businesses = grouped[category.id] || [];
          const categoryName = getCategoryName(category.name);
          const variant = category.slug; // e.g., 'hospital', 'supermarket', etc.
          return (
            <CarouselSection
              key={category.id}
              title={categoryName}
              businesses={businesses}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
}