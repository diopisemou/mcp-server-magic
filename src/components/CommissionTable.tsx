import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';
import { Commission } from '../types/referral';

interface CommissionTableProps {
  commissions: Commission[];
  loading: boolean;
}

function getCommissionStatusBadge(status: Commission['status']) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    case 'paid':
      return <Badge className="bg-green-600">Paid</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return null;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function CommissionTable({ commissions, loading }: CommissionTableProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Commission History</CardTitle>
        <CardDescription>
          Track your earnings from referrals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <h3 className="font-medium">No commissions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You'll earn commissions when your referrals make payments
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>{formatDate(commission.commission_date)}</TableCell>
                    <TableCell>{commission.subscriptions?.plan || 'Unknown'}</TableCell>
                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                    <TableCell>{getCommissionStatusBadge(commission.status)}</TableCell>
                    <TableCell>{formatDate(commission.paid_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
