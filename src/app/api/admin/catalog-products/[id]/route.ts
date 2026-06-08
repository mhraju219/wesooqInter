// src/app/api/admin/catalog-products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, businessCategoryId, categoryId, images, isActive } = body;

    // Verify the product exists
    const existing = await prisma.catalogProduct.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate business category if provided
    if (businessCategoryId) {
      const bizCat = await prisma.businessCategory.findUnique({ where: { id: businessCategoryId } });
      if (!bizCat) {
        return NextResponse.json({ error: 'Business category not found' }, { status: 404 });
      }
    }

    // Handle sub‑category: convert empty string to null and validate if it belongs to the business category
    let finalCategoryId = null;
    const finalBusinessCategoryId = businessCategoryId || existing.businessCategoryId;
    if (categoryId && categoryId !== '') {
      const subCat = await prisma.category.findFirst({
        where: { id: categoryId, businessCategoryId: finalBusinessCategoryId },
      });
      if (!subCat) {
        return NextResponse.json(
          { error: 'Sub‑category does not belong to the selected business category' },
          { status: 400 }
        );
      }
      finalCategoryId = categoryId;
    }

    const updated = await prisma.catalogProduct.update({
      where: { id: params.id },
      data: {
        name,
        description,
        businessCategoryId,
        categoryId: finalCategoryId,
        images,
        isActive,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/admin/catalog-products/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.catalogProduct.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete: set isActive to false
    await prisma.catalogProduct.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/catalog-products/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}