'use client';

import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function AdminOrderList({ orders }: { orders: any[] }) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell className="font-mono">{order.orderNumber}</TableCell>
              <TableCell>{order.businessName}</TableCell>
              <TableCell>{order.customerName || 'Guest'}</TableCell>
              <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell>${order.total.toFixed(2)}</TableCell>
              <TableCell><Badge>{order.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}