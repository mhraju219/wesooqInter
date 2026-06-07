'use client';

import { useState } from 'react';
import { useCart } from '@/store/cartStore';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';

interface SimpleProduct {
  id: string;
  name: any;               // JSON { en, ar }
  price: number;
  stockQuantity: number;
  images?: string[];
}

interface ProductCatalogProps {
  products: SimpleProduct[];
  businessId: string;
}

export function ProductCatalog({ products, businessId }: ProductCatalogProps) {
  const { locale } = useLanguage();
  const addItem = useCart((state) => state.addItem);
  const [adding, setAdding] = useState<string | null>(null);

  const getLocalizedName = (name: any): string => {
    if (!name) return 'Product';
    if (typeof name === 'string') return name;
    return name[locale] || name.en || 'Product';
  };

  const handleAddToCart = (product: SimpleProduct) => {
    setAdding(product.id);
    const productName = getLocalizedName(product.name);
    addItem({
      id: product.id,
      name: productName,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
    });
    toast.success(
      locale === 'ar'
        ? `تمت إضافة ${productName} إلى السلة`
        : `${productName} added to cart`
    );
    setTimeout(() => setAdding(null), 500);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {locale === 'ar' ? 'لا توجد منتجات متاحة حالياً' : 'No products available yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card
          key={product.id}
          className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden"
        >
          <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
            {product.images && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={getLocalizedName(product.name)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {locale === 'ar' ? 'لا توجد صورة' : 'No image'}
              </div>
            )}
          </div>
          <CardHeader className="p-4">
            <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">
              {getLocalizedName(product.name)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                {product.stockQuantity > 0
                  ? locale === 'ar'
                    ? `متوفر (${product.stockQuantity})`
                    : `In stock (${product.stockQuantity})`
                  : locale === 'ar'
                  ? 'غير متوفر'
                  : 'Out of stock'}
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              onClick={() => handleAddToCart(product)}
              disabled={adding === product.id || product.stockQuantity <= 0}
              className="w-full"
            >
              {adding === product.id
                ? locale === 'ar'
                  ? 'جاري الإضافة...'
                  : 'Adding...'
                : locale === 'ar'
                ? 'أضف إلى السلة'
                : 'Add to Cart'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}