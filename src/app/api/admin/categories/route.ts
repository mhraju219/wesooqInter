import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const businessCategoryId = searchParams.get('businessCategoryId');
    const search = searchParams.get('search') || '';

    let conditions = Prisma.sql`"isActive" = true`;
    if (businessCategoryId && businessCategoryId !== '') {
      conditions = Prisma.sql`${conditions} AND "businessCategoryId" = ${businessCategoryId}`;
    }
    if (search) {
      conditions = Prisma.sql`${conditions} AND (
        "name"->>'en' ILIKE ${`%${search}%`}
        OR "name"->>'ar' ILIKE ${`%${search}%`}
      )`;
    }

    const query = Prisma.sql`
      SELECT * FROM "Category"
      WHERE ${conditions}
      ORDER BY "createdAt" DESC
    `;
    const categories = await prisma.$queryRaw<any[]>(query);
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('GET /api/admin/categories error:', error);
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
    const { name, businessCategoryId, parentId } = body;

    if (!name?.en || !businessCategoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: name.en, businessCategoryId' },
        { status: 400 }
      );
    }

    // Verify that the business category exists
    const bizCat = await prisma.businessCategory.findUnique({
      where: { id: businessCategoryId },
    });
    if (!bizCat) {
      return NextResponse.json({ error: 'Business category not found' }, { status: 404 });
    }

    const slug = generateSlug(name.en);
    const existing = await prisma.category.findFirst({
      where: { slug, businessCategoryId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists for this business category' },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        businessCategoryId,
        parentId: parentId || null,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}