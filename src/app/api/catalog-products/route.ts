import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { barcode, name, description, category, images } = body;

  // Validate required fields
  if (!barcode || !name?.en || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if catalog product already exists
  const existing = await prisma.catalogProduct.findUnique({ where: { barcode } });
  if (existing) {
    return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 });
  }

  // Ensure category matches the merchant's business category? Not required – admin can create any.
  // For merchant-initiated creation, we trust the client to send the correct category.
  // We'll also allow admins to create any.

  const product = await prisma.catalogProduct.create({
    data: {
      barcode,
      name,
      description,
      category,
      images: images || [],
    },
  });
  return NextResponse.json(product, { status: 201 });
}