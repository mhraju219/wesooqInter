import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OrderStatus, PaymentStatus, InventoryTransactionType } from '@prisma/client';

// Helper to generate unique order number
async function generateOrderNumber(): Promise<string> {
  const prefix = 'ORD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.order.count({ where: { orderNumber: { startsWith: `${prefix}${date}` } } });
  return `${prefix}${date}${(count + 1).toString().padStart(4, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customerName, customerEmail, customerPhone, customerAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Get all product IDs from cart
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stockQuantity: true, price: true, businessId: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 400 });
    }

    // Validate stock and calculate totals
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

      const itemTotal = product.price.toNumber() * cartItem.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        total: itemTotal,
      });

      inventoryUpdates.push({
        productId: cartItem.productId,
        quantity: -cartItem.quantity, // negative for sale
        type: InventoryTransactionType.SALE,
      });
    }

    // Determine businessId (all products must belong to same business)
    const businessIds = [...new Set(products.map(p => p.businessId))];
    if (businessIds.length !== 1) {
      return NextResponse.json({ error: 'Cart contains products from multiple vendors – not supported yet' }, { status: 400 });
    }
    const businessId = businessIds[0];

    const orderNumber = await generateOrderNumber();
    const tax = 0; // optional: calculate tax
    const deliveryFee = 0;
    const total = subtotal + tax + deliveryFee;

    // Get session user (if logged in) – optional
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Use transaction to ensure all-or-nothing
    const result = await prisma.$transaction(async (tx) => {
      // Create order
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

      // Create order items
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

      // Update stock and create inventory transactions
      for (const update of inventoryUpdates) {
        await tx.product.update({
          where: { id: update.productId },
          data: { stockQuantity: { decrement: -update.quantity } }, // decrement positive quantity
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

    // TODO: Trigger real-time notification (WebSocket / WhatsApp) – Step 7
    // For now, just return success.

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