import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const businessCategoryId = searchParams.get('businessCategoryId');
    const search = searchParams.get('search') || '';

    let conditions = Prisma.sql`"isActive" = true`;
    if (businessCategoryId && businessCategoryId !== '') {
      conditions = Prisma.sql`${conditions} AND "businessCategoryId" = ${businessCategoryId}`;
    }
    if (search) {
      conditions = Prisma.sql`${conditions} AND (
        "barcode" ILIKE ${`%${search}%`}
        OR "name"->>'en' ILIKE ${`%${search}%`}
        OR "name"->>'ar' ILIKE ${`%${search}%`}
      )`;
    }

    const countQuery = Prisma.sql`SELECT COUNT(*) FROM "CatalogProduct" WHERE ${conditions}`;
    const totalResult = await prisma.$queryRaw<{ count: bigint }[]>(countQuery);
    const total = Number(totalResult[0].count);

    const query = Prisma.sql`
      SELECT * FROM "CatalogProduct"
      WHERE ${conditions}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
    const items = await prisma.$queryRaw<any[]>(query);

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('GET /api/admin/catalog-products error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { barcode, name, description, businessCategoryId, categoryId, images } = body;

    if (!barcode || !name?.en || !businessCategoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: barcode, name.en, businessCategoryId' },
        { status: 400 }
      );
    }

    // Check if barcode is unique
    const existing = await prisma.catalogProduct.findUnique({ where: { barcode } });
    if (existing) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 });
    }

    // Verify business category exists
    const bizCat = await prisma.businessCategory.findUnique({ where: { id: businessCategoryId } });
    if (!bizCat) {
      return NextResponse.json({ error: 'Business category not found' }, { status: 404 });
    }

    // Convert empty string or falsy to null, and validate if provided
    let finalCategoryId = null;
    if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== '') {
      const subCat = await prisma.category.findFirst({
        where: { id: categoryId, businessCategoryId },
      });
      if (!subCat) {
        return NextResponse.json({ error: 'Sub‑category does not belong to the selected business category' }, { status: 400 });
      }
      finalCategoryId = categoryId;
    }

    const product = await prisma.catalogProduct.create({
      data: {
        barcode,
        name,
        description,
        businessCategoryId,
        categoryId: finalCategoryId,
        images: images || [],
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/catalog-products error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}