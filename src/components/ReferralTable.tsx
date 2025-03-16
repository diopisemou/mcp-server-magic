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
import { Referral } from '../types/referral';

interface ReferralTableProps {
  referrals: Referral[];
  loading: boolean;
}

function getReferralStatusBadge(status: Referral['status']) {
  switch (status) {
    case 'clicked':
      return <Badge variant="outline">Clicked</Badge>;
    case 'signed_up':
      return <Badge variant="secondary">Signed Up</Badge>;
    case 'subscribed':
      return <Badge className="bg-green-600">Subscribed</Badge>;
    case 'expired':
      return <Badge variant="destructive">Expired</Badge>;
    default:
      return null;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

export function ReferralTable({ referrals, loading }: ReferralTableProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Referrals</CardTitle>
        <CardDescription>
          Track the status of people who clicked your referral links
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <h3 className="font-medium">No referrals yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share your referral links to start earning commissions
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Referral Source</TableHead>
                  <TableHead>Clicked On</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>{getReferralStatusBadge(referral.status)}</TableCell>
                    <TableCell>{referral.referral_links?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatDate(referral.clicked_at)}</TableCell>
                    <TableCell>{formatDate(referral.signed_up_at)}</TableCell>
                    <TableCell>{formatDate(referral.subscribed_at)}</TableCell>
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
