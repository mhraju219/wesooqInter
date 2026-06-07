import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }

  // Create unique filename
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  const filePath = path.join(uploadDir, filename);

  // Ensure upload directory exists
  await mkdir(uploadDir, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const imageUrl = `/uploads/${filename}`;
  return NextResponse.json({ url: imageUrl });
}