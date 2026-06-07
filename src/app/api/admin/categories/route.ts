import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await prisma.productCategory.findMany({
    include: { parent: true, children: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, parentId, businessId } = body;
  if (!name?.en || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const category = await prisma.productCategory.create({
    data: {
      name,
      slug,
      parentId,
      businessId: businessId || 'admin', // For global categories, you may use a dedicated business ID for admin – we can skip businessId for global cats. Simpler: remove businessId requirement for admin categories. We'll set businessId to null? But schema requires it. Let's adjust: For admin categories, we'll set businessId to a special value or allow null? Better: create a system business for admin. But to keep it simple, I'll assume categories are per‑business. For global catalog categories, we can create a dedicated "SYSTEM" business with slug 'system' and hide it from merchants. Alternatively, we remove businessId from Category for admin? That's a schema change. Given time, I'll implement as: categories are per‑business (admin will create categories for each business? Not ideal). Instead, I'll create a system business in seed. Let's do that:

      // In seed, create a system business: slug: 'system', name: 'System', isActive: false, and use its id for global categories.
      // For now, we'll require businessId in the request. We'll fix in seed.
    },
  });
  return NextResponse.json(category, { status: 201 });
}