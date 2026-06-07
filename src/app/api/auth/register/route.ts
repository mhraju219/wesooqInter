// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { UserRole, BusinessCategory } from '@prisma/client';

// Helper to generate a URL-friendly slug from a business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      businessName,
      businessCategory,
      contactPhone,
    } = body;

    // Basic validation
    if (!email || !password || !fullName?.en || !businessName?.en || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate a unique slug for the business
    let slug = generateSlug(businessName.en);
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${generateSlug(businessName.en)}-${counter++}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create business and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          slug,
          name: businessName,
          category: businessCategory as BusinessCategory,
          contactPhone,
          isActive: false,        // pending admin approval
          currencyCode: 'USD',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName,
          role: UserRole.BUSINESS_OWNER,
          businessId: business.id,
          isActive: false,        // pending approval
        },
      });

      return { business, user };
    });

    return NextResponse.json(
      { success: true, businessId: result.business.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}