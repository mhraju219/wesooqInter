'use client';

import { useCart } from '@/store/cartStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (id: string, newQty: number) => {
    if (newQty < 1) return;
    updateQuantity(id, newQty);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!checkoutData.customerName || !checkoutData.customerPhone) {
      alert('Please fill in your name and phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          customerName: checkoutData.customerName,
          customerEmail: checkoutData.customerEmail || undefined,
          customerPhone: checkoutData.customerPhone,
          customerAddress: checkoutData.customerAddress || undefined,
          // We'll derive businessId from the first product (assuming all products belong to same business for now)
          // In a real multi‑vendor cart you'd need more logic; for simplicity we assume cart is single‑vendor.
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      clearCart();
      router.push(`/order/success?orderId=${data.orderId}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <CardTitle>Your cart is empty</CardTitle>
          <p className="text-gray-500 mt-2">Add some products from the storefront.</p>
          <Link href="/">
            <Button className="mt-4">Browse Marketplace</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-primary font-bold">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full sm:w-auto text-right">
                  <span className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <Input
                  value={checkoutData.customerName}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <Input
                  value={checkoutData.customerPhone}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <Input
                  type="email"
                  value={checkoutData.customerEmail}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address (optional)</label>
                <Input
                  value={checkoutData.customerAddress}
                  onChange={(e) => setCheckoutData({ ...checkoutData, customerAddress: e.target.value })}
                />
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isSubmitting || items.length === 0}
                className="w-full"
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}