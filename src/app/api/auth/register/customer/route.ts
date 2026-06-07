import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, phone } = body;

    // Validation
    if (!email || !password || !fullName?.en) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, fullName.en' },
        { status: 400 }
      );
    }

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        phone: phone || null,
        role: UserRole.CUSTOMER,
        isActive: true,      // customers active immediately
        businessId: null,
      },
    });

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Customer registration error:', error);
    // Always return JSON, not plain text
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}