import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const barcode = req.nextUrl.searchParams.get('barcode');
  if (!barcode) {
    return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
  }

  const businessId = session.user.businessId;
  if (!businessId) {
    return NextResponse.json({ error: 'No business associated' }, { status: 400 });
  }

  // Get merchant's business to know their category
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { category: true },
  });
  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Find catalog product
  const catalog = await prisma.catalogProduct.findUnique({
    where: { barcode },
  });

  if (!catalog) {
    return NextResponse.json({ exists: false, catalog: null });
  }

  // Check category match
  if (catalog.category !== business.category) {
    return NextResponse.json({
      exists: true,
      catalog,
      inventory: null,
      categoryMismatch: true,
      message: `Product category (${catalog.category}) does not match your business category (${business.category})`
    });
  }

  // Check if merchant already has inventory for this catalog product
  const inventory = await prisma.product.findFirst({
    where: { catalogProductId: catalog.id, businessId },
    select: {
      id: true,
      costPrice: true,
      sellingPrice: true,
      stockQuantity: true,
      availableOnline: true,
    },
  });

  return NextResponse.json({
    exists: true,
    catalog: {
      id: catalog.id,
      barcode: catalog.barcode,
      name: catalog.name,
      category: catalog.category,
    },
    inventory: inventory || null,
    categoryMismatch: false,
  });
}