import { VendorCard } from './VendorCard';
import type { Business } from '@prisma/client';

interface CategorySectionProps {
  title: string;
  businesses: Partial<Business>[];
  emptyMessage: string;
  variant?: 'hospital' | 'supermarket' | 'restaurant' | 'electronics';
}

export function CategorySection({ title, businesses, emptyMessage, variant }: CategorySectionProps) {
  if (businesses.length === 0) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">{title}</h2>
        <p className="text-gray-500 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200 border-l-4 border-primary pl-3">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {businesses.map((business) => (
          <VendorCard key={business.id} business={business} variant={variant} />
        ))}
      </div>
    </div>
  );
}