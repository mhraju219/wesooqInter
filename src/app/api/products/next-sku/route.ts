import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const businessId = session.user.businessId;
    if (!businessId) {
      return NextResponse.json({ error: 'No business associated' }, { status: 400 });
    }

    let counter = await prisma.businessCounter.findUnique({
      where: { businessId },
    });
    if (!counter) {
      // Create counter if it doesn't exist (starting at 1001)
      counter = await prisma.businessCounter.create({
        data: { businessId, nextProductSku: 1001 },
      });
    }
    return NextResponse.json({ nextSku: counter.nextProductSku.toString() });
  } catch (error) {
    console.error('Error fetching next SKU:', error);
    return NextResponse.json({ error: 'Failed to generate SKU' }, { status: 500 });
  }
}