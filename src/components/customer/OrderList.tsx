'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function OrderList({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  if (orders.length === 0) {
    return <p className="text-gray-500">No orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelectedOrder(order)}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
              <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Placed: {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            <p className="font-semibold mt-2">Total: ${order.total.toFixed(2)}</p>
            <p className="text-sm">Business: {order.businessName}</p>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details – {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Status:</strong> {selectedOrder?.status}</p>
            <p><strong>Date:</strong> {selectedOrder && format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            <p><strong>Items:</strong></p>
            <ul className="list-disc pl-5">
              {selectedOrder?.items?.map((item: any) => (
                <li key={item.id}>{item.productName} x {item.quantity} – ${(item.unitPrice * item.quantity).toFixed(2)}</li>
              ))}
            </ul>
            <p className="font-bold">Total: ${selectedOrder?.total.toFixed(2)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}