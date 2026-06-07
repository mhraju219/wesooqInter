import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserList } from '@/components/admin/UserList';
import type { JsonValue } from '@prisma/client/runtime/library';

// Helper to extract business name from JSON
function getBusinessName(name: JsonValue | null): string {
  if (!name) return '—';
  if (typeof name === 'string') return name;
  if (typeof name === 'object' && name !== null) {
    const obj = name as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.ar === 'string') return obj.ar;
    const first = Object.values(obj).find(v => typeof v === 'string');
    if (first) return first as string;
  }
  return '—';
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') redirect('/auth/login');

  const users = await prisma.user.findMany({
    include: { business: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const usersForClient = users.map(user => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    businessName: user.business ? getBusinessName(user.business.name) : null,
    createdAt: user.createdAt,
  }));

  return <UserList initialUsers={usersForClient} />;
}