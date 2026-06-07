import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, images, isActive } = body;

    const updated = await prisma.catalogProduct.update({
      where: { id: params.id },
      data: {
        name,
        description,
        category,
        images: images || [],
        isActive,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH catalog product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete – set isActive to false
    await prisma.catalogProduct.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE catalog product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}