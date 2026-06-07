import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { OrderStatus, PaymentStatus, InventoryTransactionType } from '@prisma/client';

async function generateOrderNumber(): Promise<string> {
  const prefix = 'ORD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.order.count({ where: { orderNumber: { startsWith: `${prefix}${date}` } } });
  return `${prefix}${date}${(count + 1).toString().padStart(4, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, customerName, customerEmail, customerPhone, customerAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stockQuantity: true, sellingPrice: true, businessId: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 400 });
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const inventoryUpdates: any[] = [];

    for (const cartItem of items) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) continue;

      if (product.stockQuantity < cartItem.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ID ${cartItem.productId}` },
          { status: 400 }
        );
      }

      const itemTotal = Number(product.sellingPrice) * cartItem.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice: product.sellingPrice,
        total: itemTotal,
      });

      inventoryUpdates.push({
        productId: cartItem.productId,
        quantity: -cartItem.quantity,
        type: InventoryTransactionType.SALE,
      });
    }

    const businessIds = [...new Set(products.map(p => p.businessId))];
    if (businessIds.length !== 1) {
      return NextResponse.json({ error: 'Cart contains products from multiple vendors – not supported yet' }, { status: 400 });
    }
    const businessId = businessIds[0];

    const orderNumber = await generateOrderNumber();
    const tax = 0;
    const deliveryFee = 0;
    const total = subtotal + tax + deliveryFee;

    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          businessId,
          source: 'ONLINE',
          customerName,
          customerEmail,
          customerPhone,
          customerAddress: customerAddress ? JSON.parse(customerAddress) : undefined,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          subtotal,
          tax,
          deliveryFee,
          total,
          createdByUserId: userId,
        },
      });

      for (const item of orderItemsData) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
        });
      }

      for (const update of inventoryUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: { stockQuantity: { decrement: -update.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: update.productId,
            businessId,
            type: update.type,
            quantity: update.quantity,
            referenceId: order.id,
            note: `Order ${orderNumber}`,
            createdByUserId: userId,
          },
        });
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}