"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AdminOrderList({ orders }: { orders: any[] }) {
  const { locale } = useLanguage();
  const isRTL = locale === "ar";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isRTL ? "الطلبات" : "Orders"}</h1>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? "رقم الطلب" : "Order #"}</TableHead>
              <TableHead>{isRTL ? "المتجر" : "Business"}</TableHead>
              <TableHead>{isRTL ? "العميل" : "Customer"}</TableHead>
              <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
              <TableHead>{isRTL ? "الإجمالي" : "Total"}</TableHead>
              <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {isRTL ? "لا توجد طلبات" : "No orders found"}
                </TableCell>
              </TableRow>
            ) : (
              orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.orderNumber}</TableCell>
                  <TableCell>{order.businessName}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell><Badge>{order.status}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}