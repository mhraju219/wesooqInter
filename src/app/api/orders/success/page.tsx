'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrderNumber(data.orderNumber))
        .catch(console.error);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Thank you for your purchase. Your order number is:
          </p>
          <p className="font-mono text-lg font-bold bg-gray-100 p-2 rounded">
            {orderNumber || 'Loading...'}
          </p>
          <p className="text-sm text-gray-500">
            We'll notify you once the merchant confirms your order.
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">Continue Shopping</Button>
            </Link>
            <Link href={`/orders/${orderId}`} className="flex-1">
              <Button className="w-full">View Order</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}