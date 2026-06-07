import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { BusinessCategory } from '@prisma/client';

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

    const categories = await prisma.category.findMany({
      include: { children: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/admin/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, businessCategory, parentId } = body;

    if (!name?.en || !businessCategory) {
      return NextResponse.json(
        { error: 'Missing required fields: name.en, businessCategory' },
        { status: 400 }
      );
    }

    // Validate businessCategory against enum
    if (!Object.values(BusinessCategory).includes(businessCategory)) {
      return NextResponse.json({ error: 'Invalid business category' }, { status: 400 });
    }

    const slug = generateSlug(name.en);
    // Ensure unique slug per businessCategory
    const existing = await prisma.category.findFirst({
      where: { slug, businessCategory },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists for this business category' },
        { status: 409 }
      );
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
      }
      // Optional: ensure parent belongs to same businessCategory
      if (parent.businessCategory !== businessCategory) {
        return NextResponse.json(
          { error: 'Parent category must belong to the same business category' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        businessCategory,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}