import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { BusinessCategory } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryParam = searchParams.get('category');
    const search = searchParams.get('search') || '';

    // Validate category param against enum
    const category = categoryParam && Object.values(BusinessCategory).includes(categoryParam as BusinessCategory)
      ? (categoryParam as BusinessCategory)
      : null;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { barcode: { contains: search, mode: 'insensitive' } },
        { name: { path: ['en'], string_contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.catalogProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.catalogProduct.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('GET /api/admin/catalog-products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { barcode, name, description, category, images } = body;

    if (!barcode || !name?.en || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.catalogProduct.findUnique({ where: { barcode } });
    if (existing) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 });
    }

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
  } catch (error: any) {
    console.error('POST /api/admin/catalog-products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}