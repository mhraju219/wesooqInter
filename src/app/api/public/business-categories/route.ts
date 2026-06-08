import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const categories = await prisma.businessCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(categories);
}