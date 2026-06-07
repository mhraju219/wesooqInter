'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { Building2, Phone, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function getLocalizedName(name: any, locale: string): string {
  if (!name) return 'Business';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') {
    return name[locale] || name.en || 'Business';
  }
  return 'Business';
}

export function VendorCard({ business, variant }: any) {
  const { locale } = useLanguage();
  const displayName = getLocalizedName(business.name, locale);
  const featuredProducts = business.featuredProducts || [];
  const featuredServices = business.featuredServices || [];
  const hasItems = featuredProducts.length > 0 || featuredServices.length > 0;

  return (
    <Link href={`/${business.slug}`}>
      <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-32 bg-gray-100 rounded-t-lg overflow-hidden">
          {business.coverImage ? (
            <Image src={business.coverImage} alt={displayName} fill className="object-cover" />
          ) : business.logo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <Image src={business.logo} alt={displayName} width={60} height={60} className="object-contain" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Building2 className="w-12 h-12 text-primary/40" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 bg-white/90 text-black">
            {variant.toUpperCase()}
          </Badge>
        </div>

        <CardContent className="p-4 flex-1">
          <h3 className="font-bold text-lg line-clamp-1 mb-1">{displayName}</h3>
          {business.contactPhone && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <Phone className="w-3 h-3" />
              <span>{business.contactPhone}</span>
            </div>
          )}

          {hasItems && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {variant === 'hospital'
                  ? locale === 'ar'
                    ? 'الخدمات المميزة'
                    : 'Featured Services'
                  : locale === 'ar'
                  ? 'المنتجات المميزة'
                  : 'Featured Products'}
              </p>
              <div className="space-y-1">
                {(featuredProducts.length ? featuredProducts : featuredServices)
                  .slice(0, 2)
                  .map((item: any) => {
                    const itemName = getLocalizedName(item.name, locale);
                    const price = item.price ? `$${Number(item.price).toFixed(2)}` : '';
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate">{itemName}</span>
                        <span className="font-medium">{price}</span>
                      </div>
                    );
                  })}
                {(featuredProducts.length > 2 || featuredServices.length > 2) && (
                  <div className="text-xs text-primary flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3" /> + more
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 text-primary text-sm font-medium">
          {locale === 'ar' ? 'زيارة المتجر ←' : 'Visit store →'}
        </CardFooter>
      </Card>
    </Link>
  );
}