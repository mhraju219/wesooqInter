'use client';

import { useState } from 'react';
import { User, Business } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MerchantWithBusiness extends User {
  business: Business | null;
}

interface MerchantApprovalListProps {
  pending: MerchantWithBusiness[];
  approved: MerchantWithBusiness[];
}

export function MerchantApprovalList({ pending, approved }: MerchantApprovalListProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(pending);

  const handleApprove = async (userId: string) => {
    setUpdating(userId);
    try {
      const res = await fetch('/api/admin/approve-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Merchant approved successfully');
      setLocalPending(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      toast.error('Failed to approve merchant');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals ({localPending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {localPending.length === 0 ? (
            <p className="text-gray-500">No pending approvals</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localPending.map(merchant => (
                  <TableRow key={merchant.id}>
                    <TableCell>{(merchant.fullName as any)?.en || merchant.email}</TableCell>
                    <TableCell>{merchant.email}</TableCell>
                    <TableCell>{(merchant.business?.name as any)?.en || '-'}</TableCell>
                    <TableCell>{merchant.business?.category}</TableCell>
                    <TableCell>{merchant.business?.contactPhone || '-'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(merchant.id)}
                        disabled={updating === merchant.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Merchants (last 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approved.map(merchant => (
                <TableRow key={merchant.id}>
                  <TableCell>{(merchant.fullName as any)?.en || merchant.email}</TableCell>
                  <TableCell>{merchant.email}</TableCell>
                  <TableCell>{(merchant.business?.name as any)?.en || '-'}</TableCell>
                  <TableCell><Badge variant="default">Active</Badge></TableCell>
                </TableRow>
              ))}
              {approved.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center">No approved merchants yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}