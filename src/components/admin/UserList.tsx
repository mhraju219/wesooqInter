'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function UserList({ initialUsers }: { initialUsers: any[] }) {
  const { locale } = useLanguage();
  const [users, setUsers] = useState(initialUsers);

  const toggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error();
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentActive } : u));
      toast.success(locale === 'ar' ? 'تم التحديث' : 'Updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.fullName?.en || user.fullName?.ar || '-'}</TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell>{user.businessName || '-'}</TableCell>
                <TableCell>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Switch checked={user.isActive} onCheckedChange={() => toggleActive(user.id, user.isActive)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}