import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const barcode = req.nextUrl.searchParams.get('barcode');
  const excludeId = req.nextUrl.searchParams.get('excludeId');
  if (!barcode) {
    return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
  }

  const where: any = { barcode };
  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existing = await prisma.catalogProduct.findFirst({ where, select: { id: true } });

  return NextResponse.json({ exists: !!existing });
}