import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { OrderList } from '@/components/dashboard/OrderList';
import type { JsonValue } from '@prisma/client/runtime/library';

// Helper to extract product name from JSON
function getCatalogProductName(name: JsonValue | null): string {
  if (!name) return 'Product';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const obj = name as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.ar === 'string') return obj.ar;
    const first = Object.values(obj).find(v => typeof v === 'string');
    if (first) return first as string;
  }
  return 'Product';
}

export default async function OrdersPage({ params }: { params: { businessSlug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  // Find business by slug
  const business = await prisma.business.findUnique({
    where: { slug: params.businessSlug },
    select: { id: true },
  });
  if (!business) redirect('/dashboard');

  // Verify ownership
  const userBusinessSlug = session.user.businessSlug;
  const isPlatformAdmin = session.user.role === 'PLATFORM_ADMIN';
  if (!isPlatformAdmin && userBusinessSlug !== params.businessSlug) {
    redirect(`/dashboard/${userBusinessSlug}`);
  }

  // Fetch orders with includes
  const orders = await prisma.order.findMany({
    where: { businessId: business.id },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              catalogProduct: {   // 👈 get the catalog product for name
                select: { name: true }
              }
            }
          }
        }
      },
      payment: true,
      createdBy: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform orders for the client component (convert Decimal to number, extract product name)
  const ordersForClient = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: Number(order.total),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt,
    orderItems: order.orderItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
      productName: getCatalogProductName(item.product.catalogProduct.name),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track customer orders.</p>
      </div>
      <OrderList initialOrders={ordersForClient} businessId={business.id} />
    </div>
  );
}