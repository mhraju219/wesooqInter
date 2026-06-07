import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { sellingPrice, costPrice, stockQuantity, availableOnline, isActive } = body;

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
      costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
      stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : undefined,
      availableOnline,
      isActive,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Soft delete
  await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true });
}