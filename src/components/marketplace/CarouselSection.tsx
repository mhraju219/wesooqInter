'use client';

import { useRef, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VendorCard } from './VendorCard';

interface CarouselSectionProps {
  title: string;
  businesses: any[];
  variant: 'hospital' | 'supermarket' | 'restaurant' | 'electronics';
}

export function CarouselSection({ title, businesses, variant }: CarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 768px)': { slidesToScroll: 3 },
      '(min-width: 1024px)': { slidesToScroll: 4 },
    },
  });
  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const updateButtons = () => {
      setPrevDisabled(!emblaApi.canScrollPrev());
      setNextDisabled(!emblaApi.canScrollNext());
      setCanScroll(emblaApi.canScrollNext() || emblaApi.canScrollPrev());
    };
    emblaApi.on('select', updateButtons);
    emblaApi.on('init', updateButtons);
    updateButtons();
  }, [emblaApi]);

  if (!businesses || businesses.length === 0) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-500 italic">No businesses in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold border-l-4 border-primary pl-3">{title}</h2>
        {canScroll && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={prevDisabled}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => emblaApi?.scrollNext()}
              disabled={nextDisabled}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {businesses.map((business) => (
            <div key={business.id} className="min-w-[280px] flex-shrink-0 sm:min-w-[300px] md:min-w-[280px] lg:min-w-[260px]">
              <VendorCard business={business} variant={variant} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}