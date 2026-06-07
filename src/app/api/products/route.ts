import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, catalogProductId, sellingPrice, costPrice, stockQuantity, availableOnline } = body;

    if (!businessId || !catalogProductId || sellingPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify catalog product exists
    const catalog = await prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
    });
    if (!catalog) {
      return NextResponse.json({ error: 'Catalog product not found' }, { status: 404 });
    }

    // Check if already in inventory
    const existing = await prisma.product.findFirst({
      where: { catalogProductId, businessId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Product already in inventory' }, { status: 409 });
    }

    // Atomic SKU generation using PostgreSQL row-level locking
    const result = await prisma.$queryRaw<{ nextsku: number }[]>`
      INSERT INTO "BusinessCounter" ("businessId", "nextProductSku")
      VALUES (${businessId}, 1001)
      ON CONFLICT ("businessId") DO UPDATE
      SET "nextProductSku" = "BusinessCounter"."nextProductSku" + 1
      RETURNING "nextProductSku" AS nextsku;
    `;
    const skuNumber = result[0].nextsku;
    const sku = skuNumber.toString();

    const product = await prisma.product.create({
      data: {
        catalogProductId,
        businessId,
        sellingPrice: parseFloat(sellingPrice),
        costPrice: costPrice ? parseFloat(costPrice) : 0,
        stockQuantity: stockQuantity || 0,
        availableOnline: availableOnline ?? true,
        sku,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}