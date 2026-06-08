import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const categories = await prisma.businessCategory.findMany({
    where: { isActive: true },
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
  const { nameEn, nameAr } = body;
  if (!nameEn) return NextResponse.json({ error: 'Name (English) required' }, { status: 400 });
  const slug = generateSlug(nameEn);
  const existing = await prisma.businessCategory.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
  const newCat = await prisma.businessCategory.create({
    data: { name: { en: nameEn, ar: nameAr || '' }, slug },
  });
  return NextResponse.json(newCat, { status: 201 });
}