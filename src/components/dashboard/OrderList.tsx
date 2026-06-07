'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: Date;
  orderItems: OrderItem[];
}

interface OrderListProps {
  initialOrders: Order[];
  businessId: string;
}

export function OrderList({ initialOrders, businessId }: OrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (initialOrders.length === 0) {
    return <p className="text-muted-foreground">No orders found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">{order.orderNumber}</TableCell>
                <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{order.customerName || order.customerPhone || 'Guest'}</TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details – {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Customer</h4>
              <p>{selectedOrder?.customerName || 'N/A'}</p>
              <p>{selectedOrder?.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Items</h4>
              <ul className="list-disc pl-5">
                {selectedOrder?.orderItems.map((item) => (
                  <li key={item.id}>
                    {item.productName} x {item.quantity} – ${(item.unitPrice * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t pt-2">
              <strong>Total: ${selectedOrder?.total.toFixed(2)}</strong>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}