import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const businessId = params.businessId;
    if (session.user.businessId !== businessId && session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = 10;
    const statusFilter = searchParams.get('status') || undefined;

    const where = {
      businessId,
      ...(statusFilter && statusFilter !== 'ALL' ? { status: statusFilter as any } : {}),
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: { 
              product: { 
                include: { catalogProduct: { select: { name: true, images: true } } }
              } 
            },
          },
          payment: true,
          createdBy: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    // Helper to extract product name from JSON
    function getProductName(name: any): string {
      if (!name) return 'Product';
      if (typeof name === 'string') return name;
      if (typeof name === 'object') {
        return name.en || name.ar || Object.values(name)[0] || 'Product';
      }
      return 'Product';
    }

    const ordersWithNames = orders.map(order => ({
      ...order,
      orderItems: order.orderItems.map(item => ({
        ...item,
        productName: getProductName(item.product.catalogProduct.name),
        productImage: item.product.catalogProduct.images?.[0] || null,
      })),
    }));

    return NextResponse.json({
      orders: ordersWithNames,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}